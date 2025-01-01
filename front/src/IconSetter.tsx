import React, { useState, useCallback, useEffect } from 'react';
import { Meta } from './common';
import { IoIosArrowDown } from 'react-icons/io'; // or any other icon you prefer
import { IoMdAdd } from 'react-icons/io'; // 导入加号图标

interface IconAndDimensionSetterProps {
  metaList: Meta[];
  selectedIcons: Meta[];
  onIconChange: (icons: Meta[]) => void;
}

const IconAndDimensionSetter: React.FC<IconAndDimensionSetterProps> = ({
  metaList,
  selectedIcons: initialSelectedIcons,
  onIconChange,
}) => {
  const [loadedIcons, setLoadedIcons] = useState<Meta[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIcons, setSelectedIcons] = useState<Meta[]>(initialSelectedIcons);

  const loadIcons = useCallback(async () => {
    setIsLoading(true);
    const newIcons = metaList.slice(loadedIcons.length, loadedIcons.length + 20);
    const iconPromises = newIcons.map(Meta.load);
    const loadedResults = await Promise.allSettled(iconPromises);
    const newLoadedIcons = loadedResults
      .filter((result): result is PromiseFulfilledResult<Meta> => result.status === 'fulfilled')
      .map(result => result.value);
    setLoadedIcons(prevIcons => [...prevIcons, ...newLoadedIcons]);
    setIsLoading(false);
  }, [metaList, Meta.load, loadedIcons.length]);

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
        newSelectedIcons = [...prevIcons, { ...meta, rotation: false }];
      }
      onIconChange(newSelectedIcons);
      return newSelectedIcons;
    });
  }, [onIconChange]);

  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + 20);
  }, []);

  const iconMap = {};
  for (const icon of selectedIcons){
    iconMap[icon.name] = 1;
  }

  return (
    <div className="icon-and-dimension-setter rounded-lg p-4 shadow-sm">
      <div className="grid grid-cols-20 gap-1">
        {loadedIcons.slice(0, displayCount).map((icon) => (
          <button
            key={icon.name}
            onClick={() => toggleIcon(icon)}
            title={icon.name}
            className={`aspect-square flex items-center justify-center p-1 border rounded transition-all duration-300 hover:bg-gray-50 focus:outline-none ${
              iconMap[icon.name]
                ? 'border-2 border-blue-500 shadow-sm icon-wrapper selected'
                : 'border-gray-300'
            }`}
          >
            <div className="w-full h-full relative">
              <img
                src={Meta.dataURL(icon)}
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
        className="mt-6 mx-auto block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 flex items-center gap-2"
      >
        <IoMdAdd className="text-xl"/>
        <span>more icon</span>
      </button>
      )}
    </div>
  );
};

export default IconAndDimensionSetter;