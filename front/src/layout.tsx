import React, { useState, useRef, useEffect } from 'react';
import Box, { BoxMethods } from './box';
import { Frame, Meta } from './common';
import IconAndDimensionSetter from './IconAndDimensionSetter';

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
  const [boxWidth, setBoxWidth] = useState<number>(1000);
  const [boxHeight, setBoxHeight] = useState<number>(600);
  const boxRef = useRef<BoxMethods>(null);

  const handleIconChange = (updatedIcons: SelectedMeta[]) => {
    if (boxRef.current) {
      boxRef.current.updatePolygons(updatedIcons);
    }
  };

  const handleDimensionChange = (width: number, height: number) => {
    // setBoxWidth(width);
    // setBoxHeight(height);
  };
  const handleTakeScreenshot = () => {
    if (boxRef.current) {
      const imageData = boxRef.current.takeScreenshot();
      // 处理截图数据...
    }
  };
  // useEffect(() => {
  // if (boxRef.current) {
  //   boxRef.current.style.height = `${boxHeight}px`;
  // }
  // }, [boxHeight]);

  return (
    <div className="container mx-auto p-4">
      <IconAndDimensionSetter
        width={boxWidth}
        height={boxHeight}
        metaList={metaList}
        selectedIcons={selectedIcons}
        onIconChange={handleIconChange}
        onDimensionChange={handleDimensionChange}
      />

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
    </div>
  );
};

export default Layout;