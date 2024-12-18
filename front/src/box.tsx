import React, { useEffect, useRef } from 'react';
import Matter, { Body, Vector } from 'matter-js';



const convert = (item): Body => {
  const { name, width, height, polygon } = item;
  return Matter.Bodies.fromVertices(width, height, polygon, {
    render: {
      sprite: {
        texture: '/resource/' + name + '.png',
        xScale: .9,
        yScale: .9
      },
      // fillStyle: 'rgba(255, 255, 255, 0.5)',
      // strokeStyle: 'black',
      // lineWidth: 2
    }
  });
}

// class Point{
//   x: number;
//   y: number;
// }
class Meta {
  name: string;
  width: number;
  height: number;
  polygon: Vector[];
}
const MatterScene = (props) => {
  const { meta: { items } } = props;
  const canvasRef = useRef(null);


  const draw = () => {
    // 模块别名
    const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint } = Matter;

    // 创建物理引擎
    const engine = Engine.create();
    const { world } = engine;

    const width = 1200;
    const height = 600;
    // 创建渲染器
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        // background: '#f0f0f0'
        background: '/resource/bg/textile-bg.jpg'
      }
    });

    // const render = Render.create({
    //   element: sceneRef.current,
    //   engine: engine,
    //   options: {
    //     width,
    //     height,
    //     wireframes: false,
    //     background: '#f0f0f0'
    //   }
    // });
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);
    const block_width = 100;
    const block_pad = block_width / 2 - 1;
    {
      const ground = Bodies.rectangle(width / 2, height + block_pad, width, block_width, { isStatic: true });
      Composite.add(world, ground);
    }

    {
      const ground = Bodies.rectangle(-block_pad, height / 2, block_width, height, { isStatic: true });
      Composite.add(world, ground);
    }

    {
      const ground = Bodies.rectangle(width + block_pad, height / 2, block_width - 1, height, { isStatic: true });
      Composite.add(world, ground);
    }
    function shuffle(array) {
      let currentIndex = array.length;

      // While there remain elements to shuffle...
      while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }
    }
    // const polygons = items.map((item) => convert(item));
    shuffle(items);
    // Function to generate Gaussian weights for segments with adjustable smoothing
    function generateGaussianWeights(numSegments, sigma = 1) {
      const weights = [];
      const mean = (numSegments - 1) / 2; // Center of the distribution

      // Generate Gaussian weights
      for (let i = 0; i < numSegments; i++) {
        const exponent = -Math.pow(i - mean, 2) / (2 * Math.pow(sigma, 2)); // Gaussian function
        weights.push(Math.exp(exponent)); // Exponent of the Gaussian function
      }

      // Normalize weights to sum to 1
      const total = weights.reduce((sum, w) => sum + w, 0);
      return weights.map(w => w / total);
    }
    
    // Function to split an array into segments based on Gaussian weights
    function splitArrayByGaussianDistribution(array, numSegments = 10, sigma = 1) {
      const weights = generateGaussianWeights(numSegments, sigma);
      const totalItems = array.length;

      // Calculate the number of items in each segment
      const segmentSizes = weights.map(weight => Math.round(weight * totalItems));

      // Ensure the total matches the array length (adjust due to rounding errors)
      let sizeAdjustment = totalItems - segmentSizes.reduce((sum, size) => sum + size, 0);
      for (let i = 0; sizeAdjustment !== 0; i = (i + 1) % segmentSizes.length) {
        if (sizeAdjustment > 0) {
          segmentSizes[i]++;
          sizeAdjustment--;
        } else if (segmentSizes[i] > 0) {
          segmentSizes[i]--;
          sizeAdjustment++;
        }
      }

      // Split the array into segments
      const segments = [];
      let currentIndex = 0;
      for (const size of segmentSizes) {
        segments.push(array.slice(currentIndex, currentIndex + size));
        currentIndex += size;
      }

      return segments;
    }
    const units = splitArrayByGaussianDistribution(items, 15, 2);

    let scaleFactor = 0.1;
    let duration = 1000; // 动画持续时间（毫秒）
    const polygons = [];
    // Matter.Events.on(engine, 'beforeUpdate', function(event) {
    //   let elapsed = event.timestamp;
    //   if (elapsed < duration) {
    //     let scale = scaleFactor + (1 - scaleFactor) * (elapsed / duration);
    //     polygons.forEach(function(polygon) {
    //       Matter.Body.a
    //       Matter.Body.scale(polygon, scale, scale);
    //     });
    //   }
    // });

    const imageLoad = (item: Meta): Promise<Meta> => {
      const image = new Image();
      image.src = '/resource/' + item.name + '.png';
      return new Promise((resolve, reject) => {
        image.onload = () => {resolve(item)};
        image.onerror = reject;
      });
    }
    const pngDrop = (polygon) => {
      const images = polygon.map((item) => imageLoad(item));
      Promise.allSettled(images).then((res) => {
        const rect: Body[] = res.filter((result) => result.status === 'fulfilled').map(rs => convert(rs.value));
        rect.forEach((polygon) => {
          const x = Math.random() * (width - 100) + 50;
          polygons.push(polygon);
          Body.setPosition(polygon, { x, y: 0 });
        });
        Composite.add(world, rect)
      })
    }
    let i = 0;
    let ite = setInterval(() => {
      if (i >= units.length) {
        clearInterval(ite);
      }
      const polygons = units[i];
      i++;
      pngDrop(polygons);
    }, 1000)

    // 添加鼠标控制
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: true
        }
      }
    });

    Composite.add(world, mouseConstraint);

    
    render.mouse = mouse;

    // 清理函数
    return () => {
      Render.stop(render);
      Composite.clear(world, false);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  };
  useEffect(draw, []);

  return <div>
  <canvas ref={canvasRef} width={1200} height={600} />
</div>;
};

export default MatterScene;