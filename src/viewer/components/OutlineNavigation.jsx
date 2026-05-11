// src/viewer/components/OutlineNavigation.jsx
import React, { useState, useEffect } from 'react';

const OutlineNavigation = ({ pdfDoc, onNavigate, isOpen, onClose }) => {
  const [outline, setOutline] = useState([]);

  useEffect(() => {
    if (!pdfDoc || !isOpen) return;
    
    const loadOutline = async () => {
      try {
        const outline = await pdfDoc.getOutline();
        if (outline) {
          setOutline(outline);
        }
      } catch (error) {
        console.error('Failed to load outline:', error);
      }
    };
    
    loadOutline();
  }, [pdfDoc, isOpen]);

  const renderOutlineItem = (item, level = 0) => {
    const handleClick = async () => {
      if (item.dest) {
        const dest = await pdfDoc.getDestination(item.dest);
        if (dest) {
          const pageRef = dest[0];
          const pageIndex = await pdfDoc.getPageIndex(pageRef);
          onNavigate(pageIndex + 1);
        }
      }
    };

    return (
      <div key={item.title} style={{ marginLeft: `${level * 16}px` }} className="mb-1">
        <button
          onClick={handleClick}
          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-sm"
        >
          {item.title}
        </button>
        {item.items?.map(child => renderOutlineItem(child, level + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto transform transition-transform">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">Table of Contents</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            ✕
          </button>
        </div>
        
        <div className="p-4">
          {outline.length > 0 ? (
            outline.map(item => renderOutlineItem(item))
          ) : (
            <p className="text-center text-gray-500 py-8">No outline available</p>
          )}
        </div>
      </div>
    </>
  );
};

export default OutlineNavigation;