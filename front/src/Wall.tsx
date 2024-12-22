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

class IconItem {
  constructor(public item: Meta, public body: Matter.Body, public inertia: number) { }
}

const convert = (item: Meta): Body => {
  const { name, width, height, polygon } = item;
  return Matter.Bodies.fromVertices(width, height, [polygon], {
    friction: 0.8,
    label: name,
    render: {
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
  takeScreenshot: () => Promise<string>;
  rearrage: () => void;
  setBackgroundImage: (src: string) => void;
}


const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint } = Matter;
const MatterScene = forwardRef<BoxMethods, LayoutProps>((props, ref) => {
  const { width, height, background } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemMap = useRef<Map<string, IconItem>>(new Map());
  // const originalInertiaMap = useRef(new Map<string, number>());
  const engineRef = useRef<Matter.Engine>(Engine.create());
  const renderRef = useRef<Matter.Render>();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    body?: Matter.Body;
  } | null>(null);
  // console.log('rendering', background.background);

  const takeScreenshot = useCallback((): Promise<string> => {
    if (!canvasRef.current) return Promise.reject();
    if (/^#([A-Fa-f0-9]{6})$/.test(background.background) ){
      return Promise.resolve(canvasRef.current.toDataURL('image/png'));
    }
    const frontImage = new Image();
    frontImage.src = canvasRef.current.toDataURL('image/png');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = background.background;
    return new Promise(resolve => img.onload = resolve).then(() => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(frontImage, 0,0, canvasRef.current.width, canvasRef.current.height);
      return canvasRef.current.toDataURL('image/png');
    });
  }, [background]);


  const batchUpdate = (world: Matter.World, items: Meta[]) => {
    items.forEach(item => {
      const { name } = item;
      if (itemMap.current.get(name)) {
        return;
      }
      const body = convert(item);
      const x = Math.random() * (width - 100) + 50;
      Body.setPosition(body, { x, y: 0 });
      Matter.Composite.add(world, body);
      itemMap.current.set(name, new IconItem(item, body, body.inertia));
    });
  }

  const deleteItem = (world: Matter.World, body: Matter.Body) => {
    Composite.remove(world, body);
    itemMap.current.delete(body.label);
  }
  const updatePolygons = (newItems: Meta[]) => {
    const engine = engineRef.current;
    const { world } = engine;
    const _map = new Set<String>();
    newItems.forEach(item => {
      _map.add(item.name);
    });
    itemMap.current.forEach((it, name) => {
      if (!_map.has(name)) {
        deleteItem(world, it.body);
      }
    });
    batchUpdate(world, newItems);
  }
  const addWall = (world: Matter.World) => {
    const block_width = 100;
    const block_pad = block_width / 2 - 1;
    const blockOption = { isStatic: true, render: { visible: false } };
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
  const rearrage = () => {
    const engine = engineRef.current;
    const { world } = engine;
    const items = itemMap.current.values();
    const _items: Meta[] = [];
    for (const item of items) {
      deleteItem(world, item.body);
      _items.push(item.item);
    }
    itemMap.current.clear();

    const units = splitArray(_items);
    let i = 0;
    let ite = setInterval(() => {
      if (i >= units.length) {
        clearInterval(ite);
      }
      const polygons = units[i];
      i++;
      batchUpdate(world, polygons);
    }, 800)
  }
  const setBackgroundImage = (src: string) => {
    if (renderRef.current) {
      renderRef.current.options.background = `url(${src})`;
    }
  };
  useImperativeHandle(ref, () => ({
    updatePolygons,
    takeScreenshot,
    rearrage,
    setBackgroundImage,
  }), [updatePolygons, takeScreenshot, rearrage]);


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
        // background: '#f0f0f0',
        background: 'transparent'
      }
    });
    renderRef.current = render;
    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);
    addWall(world);
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

    return () => {
      Render.stop(render);
      Composite.clear(world, false);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };

  }
  useEffect(draw, []);


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
      deleteItem(engineRef.current.world, contextMenu.body);
    }
    setContextMenu(null);
  }, [contextMenu]);

  const handleRotate = useCallback(() => {
    if (contextMenu?.body) {
      if (contextMenu.body.inertia == Infinity) {
        let cur = itemMap.current.get(contextMenu.body.label);
        if (cur) {
          Body.set(contextMenu.body, "inertia", cur.inertia);
        }
      } else {
        Body.set(contextMenu.body, 'angle', 0);
        Body.set(contextMenu.body, "inertia", Infinity);
      }
    }
    setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setBackgroundImage(background.background);
  }, [background.background])
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