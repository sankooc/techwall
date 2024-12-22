import React, { useState, useRef, useEffect } from 'react';
import Box, { BoxMethods } from './Wall';
import { Frame, Meta } from './common';
import IconAndDimensionSetter from './IconSetter';
import CanvasControls from './Controller';

interface LayoutProps {
  metaList: Meta[];
  frames: Frame[];
}

interface SelectedMeta extends Meta {
  scale: number;
  rotation: boolean;
}

const Layout: React.FC<LayoutProps> = ({ metaList, frames }) => {
  const [selectedIcons, setSelectedIcons] = useState<SelectedMeta[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<Frame>(frames[0]);
  const [boxWidth, setBoxWidth] = useState<number>(1200);
  const [boxHeight, setBoxHeight] = useState<number>(500);
  const boxRef = useRef<BoxMethods>(null);

  const handleIconChange = (updatedIcons: SelectedMeta[]) => {
    if (boxRef.current) {
      boxRef.current.updatePolygons(updatedIcons);
    }
  };
  const onRearrange = () => {
    if (boxRef.current) {
      boxRef.current.rearrage();
    }
  };

  const handleDimensionChange = (width: number, height: number) => {
    // setBoxWidth(width);
    // setBoxHeight(height);
  };
  const handleTakeScreenshot = () => {
    if (boxRef.current) {
      const pro = boxRef.current.takeScreenshot();
      pro.then((dataurl: string) => {
        const link = document.createElement('a');
        link.href = dataurl;
        link.download = 'screenshot.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(dataurl);
      })
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex">
        <CanvasControls onSubmit={() => { }} onRearrange={onRearrange} onCapture={handleTakeScreenshot} ></CanvasControls>
      </div>
      <div className="mt-4 flex gap-4">
        {/* Left side - Box */}
        <div className="flex-1">
          <div className="border rounded-lg overflow-hidden">
            <Box
              ref={boxRef}
              width={boxWidth}
              height={boxHeight}
              items={selectedIcons}
              background={selectedBackground}
            />
          </div>
        </div>

        {/* Right side - Background selector */}
        <div className="w-64">
          <div className="grid gap-2">
            {frames.map((frame) => (
              <button
                key={frame.background}  // Changed from frame.name
                onClick={() => setSelectedBackground(frame)}
                className={`p-2 border rounded-lg flex items-center ${selectedBackground.background === frame.background  // Changed from name comparison
                  ? 'border-blue-500 bg-gray-400'
                  : 'border-gray-300'
                  }`}
              >
                {
                  frame.isColor()
                    ? <div className="w-full h-20" style={{ backgroundColor: frame.background }}></div>
                    : <img
                      src={frame.background}
                      alt={frame.name}
                      className="w-full h-20 object-cover rounded"
                    />
                }
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="border mt-4">

        <IconAndDimensionSetter
          metaList={metaList}
          selectedIcons={selectedIcons}
          onIconChange={handleIconChange}
        />
      </div>
    </div>
  );
};

export default Layout;