const fs = require('fs');
const path = require('path');

function parseIconNames(iconDirectory) {
  try {
    // 读取目录下的所有文件
    const files = fs.readdirSync(iconDirectory);
    
    // 过滤出.svg文件并处理文件名
    const technologies = files
      .filter((file) => {
        return file.indexOf('adobe-') < 0 && file.indexOf('aws-') < 0 && file.indexOf('microsoft') < 0 && file.indexOf('google') < 0 && file.indexOf('cc-') < 0  && file.indexOf('sublime-text') < 0 && file.endsWith('.svg')
      })
      .map(file => {
        // 移除.svg扩展名
        let name = file.replace('.svg', '');
        
        // 移除常见的后缀
        name = name.replace(/-?icon$/, '')
          .replace(/-?logo$/, '');
        
        // 将连字符替换为空格
        name = name.replace(/-/g, ' ');
        
        // 清理和标准化名称
        name = name.trim()
          .toLowerCase()
          // 移除特殊字符
          .replace(/[^\w\s]/g, '');
        
        return {
          original: file,
          searchTerm: name
        };
      })
      // 按搜索词排序
      .sort((a, b) => a.searchTerm.localeCompare(b.searchTerm));

    // 写入结果到文件
    // const outputPath = path.join(__dirname, 'technology-list.json');
    // fs.writeFileSync(outputPath, JSON.stringify(technologies, null, 2));
    
    // console.log(`Found ${technologies.length} technologies`);
    // console.log(`Results saved to: ${outputPath}`);
    
    return technologies;
  } catch (error) {
    console.error('Error parsing icon names:', error);
    return [];
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const iconDirectory = process.env['HOME'] + '/repo/geticon/icons';
  const technologies = parseIconNames(iconDirectory);
  
  console.log('\nExample entries:', technologies.length);
  const rs = {};

  for(const tech of technologies){
    const name = tech.original.substring(0,  tech.original.length -4);
    if(tech.original.indexOf("-") >0 ){
      if(tech.original.indexOf("-icon") > 0 || tech.original.indexOf("-logo") >0){
        // console.log(name);
        const _name = name.substring(0, name.length - 5);
        rs[_name] = rs[_name] || {name: _name, items: []}
        rs[_name].items.push(name);
        continue;
      }
    }
    rs[name] = rs[name] || {name, items: []}
    rs[name].items.push(name);
  }
  const list = [];
  for(const k of Object.keys(rs)) {
    list.push(rs[k]);
  }
  fs.writeFileSync('list.json', JSON.stringify(list));
}

module.exports = parseIconNames;
