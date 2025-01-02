import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIcons, setSelectedIcons] = useState<Meta[]>(initialSelectedIcons);
  const [searchInput, setSearchInput] = useState<string>('');
  const [prevLoadedCount, setPrevLoadedCount] = useState<number>(0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const filteredMetaList = metaList.filter(meta => 
        meta.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setLoadedIcons([]);
      setDisplayCount(20);
    }
  };

  // Filter metaList based on search
  const filteredMetaList = useMemo(() => {
    return metaList.filter(meta => 
      meta.name.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [metaList, searchInput]);

  const loadIcons = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    const currentLoaded = loadedIcons.length;
    const newIcons = metaList.slice(loadedIcons.length, loadedIcons.length + 20);
    const iconPromises = newIcons.map(Meta.load);
    const loadedResults = await Promise.allSettled(iconPromises);
    const newLoadedIcons = loadedResults
      .filter((result): result is PromiseFulfilledResult<Meta> => result.status === 'fulfilled')
      .map(result => result.value);
    setLoadedIcons(prevIcons => [...prevIcons, ...newLoadedIcons]);
    setIsLoading(false);
  }, [filteredMetaList, loadedIcons.length, isLoading]);

  // Handle search changes and initial load
  useEffect(() => {
    const shouldLoad = loadedIcons.length < displayCount && loadedIcons.length < filteredMetaList.length && !isLoading;
    if (shouldLoad) {
      loadIcons();
    }
  }, [loadIcons, loadedIcons.length, displayCount, filteredMetaList.length, isLoading]);

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
    setPrevLoadedCount(loadedIcons.length);
    setDisplayCount(prev => prev + 20);
  }, [loadedIcons.length]);

  const iconMap = {};
  for (const icon of selectedIcons){
    iconMap[icon.name] = 1;
  }
  return (
    <div className="icon-and-dimension-setter rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search icons, press Enter to confirm..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-20 gap-1 relative">
        {loadedIcons.map((icon, index) => (
          <button
            key={icon.name}
            onClick={() => toggleIcon(icon)}
            title={icon.name}
            style={{
              animationDelay: `${(index - prevLoadedCount) * 0.05}s`
            }}
            className={`${index >= prevLoadedCount ? 'icon-fade-in' : ''} aspect-square flex items-center justify-center p-1 border rounded transition-all duration-300 hover:bg-gray-50 focus:outline-none ${index >= prevLoadedCount ? 'opacity-0' : ''} ${
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
        {isLoading && (
          <div className="col-span-20 flex items-center justify-center py-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 text-sm">Loading more icons...</p>
            </div>
          </div>
        )}
      </div>
      {!isLoading && loadedIcons.length < filteredMetaList.length && (
        <button 
          onClick={loadMore} 
          className="mt-6 mx-auto block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 flex items-center gap-2"
        >
          <IoMdAdd className="text-xl"/>
          <span>More icons</span>
        </button>
      )}
    </div>
  );
};

export default IconAndDimensionSetter;