const axios = require('axios');
const fs = require('fs');

// 令牌桶实现的速率限制器
class RateLimiter {
  constructor(maxTokens, refillRate) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate; // tokens per millisecond
    this.lastRefillTime = Date.now();
  }

  async getToken() {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + timePassed * this.refillRate
    );
    this.lastRefillTime = now;

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate;
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.getToken();
    }

    this.tokens -= 1;
    return true;
  }
}

// 创建限速器实例
const githubLimiter = new RateLimiter(1, 1 / (3 * 1000)); // 1 request per 10 seconds
const stackoverflowLimiter = new RateLimiter(1, 1 / (3 * 1000)); // 1 request per 10 seconds

// 带限速的 API 请求函数
async function rateLimitedRequest(url, options, limiter) {
  await limiter.getToken();
  try {
    const response = await axios(url, options);
    // 检查剩余配额
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    if (remaining && reset) {
      console.log(`API calls remaining: ${remaining}, Reset time: ${new Date(reset * 1000).toLocaleString()}`);
    }
    return response;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded. Waiting for reset...');
      const resetTime = error.response.headers['x-ratelimit-reset'];
      if (resetTime) {
        const waitTime = (resetTime * 1000) - Date.now();
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return rateLimitedRequest(url, options, limiter);
      }
    }
    throw error;
  }
}

async function getStackOverflowTagCount(tag) {
  try {
    const response = await rateLimitedRequest(
      `https://api.stackexchange.com/2.3/tags/${tag}/info`,
      {
        params: {
          site: 'stackoverflow'
        }
      },
      stackoverflowLimiter
    );
    return response.data.items[0]?.count || 0;
  } catch (error) {
    console.error(`Error fetching tag info for ${tag}:`, error.message);
    return 0;
  }
}

async function searchGithub(searchTerm) {
  try {
    const response = await rateLimitedRequest(
      `https://api.github.com/search/repositories?q=topic:${encodeURIComponent(searchTerm.toLowerCase())}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
          'User-Agent': 'Mozilla/5.0'
        }
      },
      githubLimiter
    );

    const count = response.data.total_count || 0;
    return {
      score: count,
      details: {
        repositoryCount: count,
        source: 'GitHub API'
      }
    };
  } catch (error) {
    console.error(`Error searching GitHub topics for ${searchTerm}:`, error.message);
    return {
      score: 0,
      details: {
        repositoryCount: 0,
        error: error.message,
        source: 'GitHub API'
      }
    };
  }
}

async function processTechnologyList() {
  const list = JSON.parse(fs.readFileSync('list.json', 'utf8'));

  let count = 0;
  for (const item of list) {
    const {name, github, stack} = item;
    count ++;
    if(github != undefined){
      continue;
    }
    if(stack != undefined){
      continue;
    }
    console.log('resolve', name, 'index', count);
    // const rs = await getStackOverflowTagCount(name);
    // console.log(rs)
    const rs = await searchGithub(name);
    item.github = rs;
    fs.writeFileSync('list.json', JSON.stringify(list, null, 2));
    console.log('resolve', name, 'complete');
  }
}



async function sortlist() {
  const list = JSON.parse(fs.readFileSync('list.json', 'utf8'));
  list.sort((a, b) => -a.github.score + b.github.score);
  let str = "[";
  for(const item of list){
    const {items} = item;
    for(const name of items){
      str += `, "${name}"`;
    }
  }
  str += "]";
  fs.writeFileSync('list.txt', str);
};


module.exports = {
  searchGithub,
  processTechnologyList
};