import React, { useState, useCallback, useEffect } from 'react';
import { Meta } from './common';
import { IoIosArrowDown } from 'react-icons/io'; // or any other icon you prefer

interface IconAndDimensionSetterProps {
  metaList: Meta[];
  selectedIcons: Meta[];
  width: number;
  height: number;
  onIconChange: (icons: Meta[]) => void;
  onDimensionChange: (width: number, height: number) => void;
}

const IconAndDimensionSetter: React.FC<IconAndDimensionSetterProps> = ({
  metaList,
  selectedIcons: initialSelectedIcons,
  width,
  height,
  onIconChange,
  onDimensionChange
}) => {
  const [loadedIcons, setLoadedIcons] = useState<Meta[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIcons, setSelectedIcons] = useState<Meta[]>(initialSelectedIcons);

  const loadImage = useCallback((meta: Meta): Promise<Meta> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = Meta.url(meta);
      
      const timer = setTimeout(() => {
        reject(new Error('Image load timed out'));
      }, 5000);

      img.onload = () => {
        clearTimeout(timer);
        resolve(meta);
      };

      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Image load failed'));
      };
    });
  }, []);

  const loadIcons = useCallback(async () => {
    setIsLoading(true);
    const newIcons = metaList.slice(loadedIcons.length, loadedIcons.length + 20);
    const iconPromises = newIcons.map(loadImage);
    const loadedResults = await Promise.allSettled(iconPromises);
    const newLoadedIcons = loadedResults
      .filter((result): result is PromiseFulfilledResult<Meta> => result.status === 'fulfilled')
      .map(result => result.value);
    setLoadedIcons(prevIcons => [...prevIcons, ...newLoadedIcons]);
    setIsLoading(false);
  }, [metaList, loadImage, loadedIcons.length]);

  useEffect(() => {
    if (loadedIcons.length < displayCount) {
      loadIcons();
    }
  }, [loadIcons, loadedIcons.length, displayCount]);

  const toggleIcon = useCallback((meta: Meta) => {
    setSelectedIcons((prevIcons: Meta[]) => {
      const index = prevIcons.findIndex(icon => icon.name === meta.name);
      let newSelectedIcons: Meta[];
      if (index !== -1) {
        newSelectedIcons = prevIcons.filter(icon => icon.name !== meta.name);
      } else {
        newSelectedIcons = [...prevIcons, { ...meta, scale: 1, rotation: false }];
      }
      onIconChange(newSelectedIcons);
      return newSelectedIcons;
    });
  }, [onIconChange]);

  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + 20);
  }, []);

  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    onDimensionChange(newWidth, height);
  }, [height, onDimensionChange]);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10);
    onDimensionChange(width, newHeight);
  }, [width, onDimensionChange]);


  const iconMap = {};
  for (const icon of selectedIcons){
    iconMap[icon.name] = 1;
  }

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="grid grid-cols-20 gap-1">
        {loadedIcons.slice(0, displayCount).map((icon) => (
          <button
            key={icon.name}
            onClick={() => toggleIcon(icon)}
            className={`aspect-square flex items-center justify-center p-1 border rounded transition-all duration-300 hover:bg-gray-50 ${
              iconMap[icon.name]
                ? 'border-blue-500 shadow-sm bg-gray-400'  // Changed to bg-gray-200 for deeper background
                : 'border-gray-300'
            }`}
          >
            <div className="w-full h-full relative">
              <img
                src={Meta.url(icon)}
                alt={icon.name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </button>
        ))}
      </div>
      {isLoading && (
        <p className="text-center mt-4 text-gray-600">Loading...</p>
      )}
      {!isLoading && displayCount < metaList.length && (
        <button
          onClick={loadMore}
          className="mt-6 mx-auto block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
        >
          Load More
        </button>
      )}
      <div className="mt-8 flex justify-center space-x-4">
        <label className="flex items-center">
          <span className="mr-2">Width:</span>
          <input
            type="number"
            value={width}
            onChange={handleWidthChange}
            min="1"
            className="w-20 px-2 py-1 border rounded-md"
          />
        </label>
        <label className="flex items-center">
          <span className="mr-2">Height:</span>
          <input
            type="number"
            value={height}
            onChange={handleHeightChange}
            min="1"
            className="w-20 px-2 py-1 border rounded-md"
          />
        </label>
      </div>
    </div>
  );
};

export default IconAndDimensionSetter;