// src/context.tsx
import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete?: () => void;
  onRotate?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onDelete, onRotate }) => {
  return (
    <div 
      className="fixed bg-white shadow-lg rounded-lg py-2 min-w-[120px] z-50"
      style={{ left: x, top: y }}
    >
      <button 
        className="w-full px-4 py-1 text-left hover:bg-gray-100"
        onClick={onRotate}
      >
        旋转/固定
      </button>
      <button 
        className="w-full px-4 py-1 text-left hover:bg-gray-100 text-red-600"
        onClick={onDelete}
      >
        删除
      </button>
    </div>
  );
};