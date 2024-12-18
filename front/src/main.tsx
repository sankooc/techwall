import React, { useRef, useState } from 'react';
// import initSync from 'conv';
import init, { load_svg, SVGResult } from 'node_modules/conv/conv';

const App: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setload] = useState(false);
  init().then(() => {
    console.log("load complete");
    setload(true);
  })
  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = function () {
          const arrayBuffer: ArrayBuffer = this.result as ArrayBuffer;
          const array = new Uint8Array(arrayBuffer);
          const rt = load_svg(array);
          // console.log(rt);
          // const data = rt.data();
          // console.log(data);
          // const size = rt.rect();
          // const poligon = rt.polygon();
          // console.log(size.x, size.y);
          // console.log(poligon);
          // const base64Data = btoa(String.fromCharCode.apply(null, array));
          // const img_image = 'data:image/png;base64,' + base64Data;
          drawSVGOnCanvas(rt);
      };
      reader.readAsArrayBuffer(file);
      // const reader = new FileReader();

      // reader.onload = (e) => {
      //   const svgContent = e.target?.result as string;
      //   drawSVGOnCanvas(svgContent);
      // };

      // reader.readAsText(file);
      // load_svg(null);
    } else {
      alert('请上传有效的 SVG 文件！');
    }
  };

  const drawPath = (context, ps) => {
    const head = ps[0];
    let index = 1;
    context.beginPath();
    context.moveTo(head.x(), head.y());
    while(true) {
      const p = ps[index];
      context.lineTo(p.x(), p.y());
      index++;
      if(index >= ps.length) {
        context.lineTo(head.x(), head.y());
        break;
      }
    }
    context.stroke();
  }

  const setpoint = (context, p) => {
    
    context.fillStyle = 'red';
    context.beginPath();
    context.arc(p.x(), p.y(), 2, 0, 2 * Math.PI);
    // context.arc(p.x(), p.y(), 2, 0, 2 * Math.PI);
    context.fill();
  }
  // 将 SVG 内容绘制到 Canvas
  const drawSVGOnCanvas = (rt: SVGResult) => {
    const data = rt.data();
    const svgBlob = new Blob([data], { type: 'image/png' });
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      console.log(canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const ps = rt.polygon();
      for(const p of ps){
        setpoint(context, p);
      }
      drawPath(context, ps);
    };
    img.src = url;
  };

  if (!loaded){
    return <div>loading wasm</div>
  }
  return (
    <div style={{ textAlign: 'center', marginTop: '20px'}}>
      <input type="file" accept=".svg" onChange={handleFileUpload} />

      <canvas ref={canvasRef} style={{ border: '1px solid #ccc', marginTop: '20px' }}></canvas>
    </div>
  );
};

export default App;
