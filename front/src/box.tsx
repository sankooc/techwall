import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Matter, { Body, Vector } from 'matter-js';
import { splitArray } from './util';
import { Frame, Meta } from "./common";
import { ContextMenu } from './context';

interface LayoutProps {
  width: number;
  height: number;
  items: Meta[];
  onRef?: (ref: BoxMethods) => void;
  background: Frame;
}

const convert = (item: Meta): Body => {
  const { name, width, height, polygon } = item;
  return Matter.Bodies.fromVertices(width, height, [polygon], {
    // inertia: Infinity,
    // friction: 0.8, 
    label: name,
    render: {
      // visible: true,
      // lineWidth: 2,
      // strokeStyle: '#2c3e50',
      // fillStyle: 'transparent',
      sprite: {
        texture: Meta.url(item),
        xScale: .9,
        yScale: .9
      },
    }
  });
}
export interface BoxMethods {
  updatePolygons: (items: Meta[]) => void;
  takeScreenshot: () => string;
}


const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint } = Matter;
const MatterScene = forwardRef<BoxMethods, LayoutProps>((props, ref) => {
  const { items, width, height, background } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemMap = useRef<Map<string, Body>>(new Map());
  const engineRef = useRef<Matter.Engine>(Engine.create());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    body?: Matter.Body;
  } | null>(null);
  // console.log('rendering', background.background);

  const takeScreenshot = useCallback(() => {
    if (!canvasRef.current) return '';
    return canvasRef.current.toDataURL('image/png');
  }, []);

  const updatePolygons = (newItems: Meta[]) => {
    const engine = engineRef.current;
    const { world } = engine;
    newItems.forEach(item => {
      const { name } = item;
      if (itemMap.current.get(name)) {
        return;
      }
      const body = convert(item);
      itemMap.current.set(name, body);
      const x = Math.random() * (width - 100) + 50;
      Body.setPosition(body, { x, y: 0 });
      Matter.Composite.add(world, body);
    });
  }
  useImperativeHandle(ref, () => ({
    updatePolygons,
    takeScreenshot
  }), [updatePolygons, takeScreenshot]);
  const draw = () => {
    // 创建物理引擎
    const engine = engineRef.current;
    const { world } = engine;
    // 创建渲染器

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        // background: background.background,
        background: '#f0f0f0'
        // background: '/resource/bg/textile-bg.jpg'
      }
    });
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);
    const block_width = 100;
    const block_pad = block_width / 2 - 1;
    const blockOption = { isStatic: true, render: { visible: false } };
    const ready = () => {
      {
        const ground = Bodies.rectangle(width / 2, height + block_pad, width, block_width, blockOption);
        Composite.add(world, ground);
      }

      {
        const ground = Bodies.rectangle(-block_pad, height / 2, block_width, height, blockOption);
        Composite.add(world, ground);
      }

      {
        const ground = Bodies.rectangle(width + block_pad, height / 2, block_width - 1, height, blockOption);
        Composite.add(world, ground);
      }

    }
    // const units = splitArray(items);
    // const imageLoad = (item: Meta): Promise<Meta> => {
    //   const image = new Image();
    //   image.src = '/resource/' + item.name + '.png';
    //   return new Promise((resolve, reject) => {
    //     image.onload = () => { resolve(item) };
    //     image.onerror = reject;
    //   });
    // }
    ready();
    // const pngDrop = (polygon: Meta[]) => {
    //   if (!polygon) return;
    //   const images = polygon.map((item: Meta) => imageLoad(item));
    //   Promise.allSettled(images).then((res) => {
    //     const rect: Body[] = res.filter((result) => result.status === 'fulfilled').map(rs => convert(rs.value));
    //     rect.forEach((polygon) => {
    //       const x = Math.random() * (width - 100) + 50;
    //       Body.setPosition(polygon, { x, y: 0 });
    //     });
    //     Composite.add(world, rect)
    //   })
    // }
    // let i = 0;
    // let ite = setInterval(() => {
    //   if (i >= units.length) {
    //     clearInterval(ite);
    //   }
    //   const polygons = units[i];
    //   i++;
    //   pngDrop(polygons);
    // }, 1000)

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



    // 更新多边形的方法
    // const updatePolygons = (newItems: Meta[]) => {
    //   newItems.forEach(item => {
    //     const { name } = item;
    //     if (itemMap.current.get(name)) {
    //       return;
    //     }
    //     const body = convert(item);
    //     itemMap.current.set(name, body);
    //     console.log(body);
    //     Matter.Composite.add(world, body);
    //   });
    // }

    // 暴露方法给父组件
    // useImperativeHandle(ref, () => ({
    //   updatePolygons,
    //   takeScreenshot
    // }), [updatePolygons, takeScreenshot]);

    return () => {
      Render.stop(render);
      Composite.clear(world, false);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };

  }


  // const draw = () => {
  //   // 模块别名
  //   const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint } = Matter;

  //   // 创建物理引擎
  //   const engine = Engine.create();
  //   const { world } = engine;
  //   // 创建渲染器
  //   const render = Matter.Render.create({
  //     canvas: canvasRef.current,
  //     engine: engine,
  //     options: {
  //       width,
  //       height,
  //       wireframes: false,
  //       // background: '#f0f0f0'
  //       background: '/resource/bg/textile-bg.jpg'
  //     }
  //   });
  //   Render.run(render);

  //   const runner = Runner.create();
  //   Runner.run(runner, engine);
  //   const block_width = 100;
  //   const block_pad = block_width / 2 - 1;
  //   const blockOption = { isStatic: true, render: { visible: false } };
  //   {
  //     const ground = Bodies.rectangle(width / 2, height + block_pad, width, block_width, blockOption);
  //     Composite.add(world, ground);
  //   }

  //   {
  //     const ground = Bodies.rectangle(-block_pad, height / 2, block_width, height, blockOption);
  //     Composite.add(world, ground);
  //   }

  //   {
  //     const ground = Bodies.rectangle(width + block_pad, height / 2, block_width - 1, height, blockOption);
  //     Composite.add(world, ground);
  //   }
  //   const units = splitArray(items);
  //   const imageLoad = (item: Meta): Promise<Meta> => {
  //     const image = new Image();
  //     image.src = '/resource/' + item.name + '.png';
  //     return new Promise((resolve, reject) => {
  //       image.onload = () => { resolve(item) };
  //       image.onerror = reject;
  //     });
  //   }
  //   const pngDrop = (polygon: Meta[]) => {
  //     if (!polygon) return;
  //     const images = polygon.map((item: Meta) => imageLoad(item));
  //     Promise.allSettled(images).then((res) => {
  //       const rect: Body[] = res.filter((result) => result.status === 'fulfilled').map(rs => convert(rs.value));
  //       rect.forEach((polygon) => {
  //         const x = Math.random() * (width - 100) + 50;
  //         Body.setPosition(polygon, { x, y: 0 });
  //       });
  //       Composite.add(world, rect)
  //     })
  //   }
  //   let i = 0;
  //   let ite = setInterval(() => {
  //     if (i >= units.length) {
  //       clearInterval(ite);
  //     }
  //     const polygons = units[i];
  //     i++;
  //     pngDrop(polygons);
  //   }, 1000)

  //   // 添加鼠标控制
  //   const mouse = Mouse.create(render.canvas);
  //   const mouseConstraint = MouseConstraint.create(engine, {
  //     mouse: mouse,
  //     constraint: {
  //       stiffness: 0.2,
  //       render: {
  //         visible: true
  //       }
  //     }
  //   });

  //   Composite.add(world, mouseConstraint);


  //   render.mouse = mouse;
  //   // 清理函数
  //   // return () => {
  //   //   Render.stop(render);
  //   //   Composite.clear(world, false);
  //   //   Engine.clear(engine);
  //   //   render.canvas.remove();
  //   //   render.textures = {};
  //   // };
  // };
  useEffect(draw, []);
  // draw();
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 转换为Matter.js坐标
    const mousePosition = {
      x: x,
      y: y
    };

    // 检查点击位置是否在任何物体上
    const bodies = Composite.allBodies(engineRef.current.world);
    const clickedBody = bodies.find(body => 
      Matter.Bounds.contains(body.bounds, mousePosition) &&
      !body.isStatic
    );
    if (clickedBody) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        body: clickedBody
      });
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (contextMenu?.body) {
      Composite.remove(engineRef.current.world, contextMenu.body);
      itemMap.current.delete(contextMenu.body.label);
    }
    setContextMenu(null);
  }, [contextMenu]);

  const handleRotate = useCallback(() => {
    if (contextMenu?.body) {
      
      Body.rotate(contextMenu.body, Math.PI / 2);
    }
    setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return <div className="relative">
  <canvas 
    ref={canvasRef} 
    width={width} 
    height={height}
    onContextMenu={handleContextMenu}
  />
  {contextMenu && (
    <ContextMenu
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={() => setContextMenu(null)}
      onDelete={handleDelete}
      onRotate={handleRotate}
    />
  )}
</div>;
});

export default MatterScene;