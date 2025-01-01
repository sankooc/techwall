import { forwardRef, MutableRefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Matter, { Body, Vector } from 'matter-js';
import { splitArray } from './util';
import { Frame, Meta } from "./common";
import { ContextMenu } from './AppContext';

interface LayoutProps {
  width: number;
  height: number;
  items: Meta[];
  onRef?: (ref: BoxMethods) => void;
  background: Frame;
}


class Layer {
  constructor(public engine: Matter.Engine, public render: Matter.Render, public runner: Matter.Runner, public itemMap: Map<string, IconItem>) { }

  getRect(): [number, number] {
    const { width, height } = this.render.options;
    return [width, height];
  }
  rearrage(period: number = 800) {
    const items = this.itemMap.values();
    const _items: Meta[] = [];
    for (const item of items) {
      this.deleteItem(item.body);
      _items.push(item.item);
    }
    this.itemMap.clear();

    const _units = splitArray(_items);
    const units = _units.filter(unit => unit.length > 0);
    if(units.length == 0) return;
    this.updateItems(units[0]);
    let i = 1;
    let ite = setInterval(() => {
      if (i >= units.length) {
        clearInterval(ite);
      }
      const polygons = units[i];
      i++;
      this.updateItems(polygons);
    }, period)
  }

  _addMouse() {
    const mouse = Mouse.create(this.render.canvas);
    const mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: true
        }
      }
    });

    Composite.add(this.engine.world, mouseConstraint);
    this.render.mouse = mouse;
  }
  _addBlock() {
    const [width, height] = this.getRect();
    const { world } = this.engine;
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
  addItems(newItems: Meta[]) {
    const { world } = this.engine;
    const _map = new Set<String>();
    newItems.forEach(item => {
      _map.add(item.name);
    });
    this.itemMap.forEach((it, name) => {
      if (!_map.has(name)) {
        this.deleteItem(it.body);
      }
    });
    this.updateItems(newItems);
  }
  updateItems(items: Meta[]) {
    const { world } = this.engine;
    const [width, height] = this.getRect();
    items.forEach(item => {
      const { name } = item;
      if (this.itemMap.get(name)) {
        return;
      }
      const body = convert(item);
      const x = Math.random() * (width - 100) + 50;
      Body.setPosition(body, { x, y: 0 });
      Matter.Composite.add(world, body);
      this.itemMap.set(name, new IconItem(item, body, body.inertia));
    });
  }
  deleteItem(body: Matter.Body) {
    const { world } = this.engine;
    Composite.remove(world, body);
    this.itemMap.delete(body.label);
  }
  setBackground(src: string){
    this.render.options.background = `url(${src})`;
  }
  toggleRotation(body: Matter.Body) {
    if (body.inertia == Infinity) {
      let cur = this.itemMap.get(body.label);
      if (cur) {
        Body.set(body, "inertia", cur.inertia);
      }
    } else {
      Body.set(body, 'angle', 0);
      Body.set(body, "inertia", Infinity);
    }
  }
  select(mousePosition: Vector): Matter.Body | undefined {
    const bodies = Composite.allBodies(this.engine.world);
    return bodies.find(body =>
      Matter.Bounds.contains(body.bounds, mousePosition) &&
      !body.isStatic
    );
  }
  dispose() {
    const { world } = this.engine;
    Render.stop(this.render);
    Composite.clear(world, false);
    Engine.clear(this.engine);
    this.render.canvas.remove();
    this.render.textures = {};
  }

  static create(canvasRef: MutableRefObject<HTMLCanvasElement>, width, height): Layer {
    const engine = Engine.create();
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent'
      }
    });
    Render.run(render);
    const itemMap = new Map<string, IconItem>();
    const runner = Runner.create();
    Runner.run(runner, engine);
    const layer = new Layer(engine, render, runner, itemMap);
    layer._addBlock();
    layer._addMouse();
    return layer;
  }
}
class IconItem {
  constructor(public item: Meta, public body: Matter.Body, public inertia: number) { }
}
const convert = (item: Meta): Body => {
  const { name, width, height, polygon, scale } = item;
  return Matter.Bodies.fromVertices(width, height, [polygon], {
    friction: 0.8,
    label: name,
    render: {
      sprite: {
        texture: Meta.dataURL(item),
        xScale: 0.9 * 1,
        yScale: 0.9 * 1
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
  const layerRef = useRef<Layer>();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    body?: Matter.Body;
  } | null>(null);
  const [showScaleInput, setShowScaleInput] = useState(false);
  const [scaleValue, setScaleValue] = useState('1');
  const selectedBodyRef = useRef<Matter.Body | null>(null);

  const takeScreenshot = useCallback((): Promise<string> => {
    if (!canvasRef.current) return Promise.reject();
    if (background.isColor()) {
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
      ctx.drawImage(frontImage, 0, 0, canvasRef.current.width, canvasRef.current.height);
      return canvasRef.current.toDataURL('image/png');
    });
  }, [background]);


  const draw = () => {
    layerRef.current = Layer.create(canvasRef, width, height);
    return layerRef.current.dispose.bind(layerRef.current);
  };
  const rearrage = () => {
    if (layerRef.current) {
      layerRef.current.rearrage();
    }
  }
  const setBackgroundImage = (src: string) => {
    if (layerRef.current) {
      layerRef.current.setBackground(src);
    }
  };
  const updatePolygons = (items: Meta[]) => {
    if (layerRef.current) {
      layerRef.current.addItems(items);
    }
  }
  useImperativeHandle(ref, () => ({
    updatePolygons,
    takeScreenshot,
    rearrage,
    setBackgroundImage,
  }), [updatePolygons, takeScreenshot, rearrage]);

  useEffect(draw, []);


  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const mousePosition = {
      x: x,
      y: y
    };
    if (!layerRef.current) return;
    layerRef.current.select(mousePosition);
    const clickedBody = layerRef.current.select(mousePosition);
    if (clickedBody) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        body: clickedBody
      });
    }
  }, []);


  const handleRotate = useCallback(() => {
    if (contextMenu?.body) {
      if(layerRef.current){
        layerRef.current.toggleRotation(contextMenu.body);
      }
    }
    setContextMenu(null);
  }, [contextMenu]);

  const handleScaleClick = useCallback(() => {
    if (contextMenu?.body) {
      selectedBodyRef.current = contextMenu.body;
      setShowScaleInput(true);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleScaleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const scale = parseFloat(scaleValue);
    if (scale >= 1 && scale <= 3 && selectedBodyRef.current) {
      const body = selectedBodyRef.current;
      Matter.Body.scale(body, scale, scale);

      if (body.render.sprite) {
        body.render.sprite.xScale = 0.9 * scale;
        body.render.sprite.yScale = 0.9 * scale;
      }

      setShowScaleInput(false);
      setScaleValue('1');
    }
  }, [scaleValue]);

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
        // onDelete={handleDelete}
        onRotate={handleRotate}
        onScale={handleScaleClick}
      />
    )}
    {showScaleInput && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <form onSubmit={handleScaleSubmit} className="bg-white p-4 rounded-lg">
          <label className="block mb-2">
            Scale (1-3):
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={scaleValue}
              onChange={(e) => setScaleValue(e.target.value)}
              className="ml-2 border rounded px-2 py-1"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowScaleInput(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    )}
  </div>;
});

export default MatterScene;