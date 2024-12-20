import React, { useState } from 'react';
import { IoMdCheckmark, IoMdShuffle, IoMdCamera } from 'react-icons/io';

interface CanvasControlsProps {
  onSubmit: (width: number, height: number, maxWidth: number) => void;
  onRearrange: () => void;
  onCapture: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({ onSubmit, onRearrange, onCapture }) => {
  const [width, setWidth] = useState(1600);
  const [height, setHeight] = useState(800);
  const [maxWidth, setMaxWidth] = useState(1600);

  const handleSubmit = () => {
    if (width > 0 && height > 0 && maxWidth > 0 && maxWidth <= width) {
        const isConfirmed = window.confirm("All icons will be rearranged. Do you want to continue?");
        if (isConfirmed) {
          onSubmit(width, height, maxWidth);
        }
      } else {
        alert('Please enter valid positive integers. Max width should not exceed width.');
      }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 0);
    setter(value);
  };

  return (
    <div className="w-full bg-gray-100 p-4 rounded-lg shadow flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <span className="mr-2 text-sm font-medium text-gray-700">Width:</span>
          <input
            type="number"
            value={width}
            onChange={handleInputChange(setWidth)}
            min="1"
            className="w-20 px-2 py-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>
        <label className="flex items-center">
          <span className="mr-2 text-sm font-medium text-gray-700">Height:</span>
          <input
            type="number"
            value={height}
            onChange={handleInputChange(setHeight)}
            min="1"
            className="w-20 px-2 py-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>
        <label className="flex items-center">
          <span className="mr-2 text-sm font-medium text-gray-700">Item Width:</span>
          <input
            type="number"
            value={maxWidth}
            onChange={handleInputChange(setMaxWidth)}
            min="1"
            max={width}
            className="w-20 px-2 py-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </label>
        <button
          onClick={handleSubmit}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <IoMdCheckmark className="mr-2" /> Submit
        </button>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onRearrange}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <IoMdShuffle className="mr-2" /> Rearrange
        </button>
        <button
          onClick={onCapture}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <IoMdCamera className="mr-2" /> Capture
        </button>
      </div>
    </div>
  );
};

export default CanvasControls;