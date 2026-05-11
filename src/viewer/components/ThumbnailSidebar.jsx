// src/viewer/components/ThumbnailSidebar.jsx
import React, { useState, useEffect, useRef } from 'react';

const ThumbnailSidebar = ({ pdfDoc, currentPage, onPageClick, isOpen, onClose }) => {
  const [thumbnails, setThumbnails] = useState({});
  const [loading, setLoading] = useState({});
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !isOpen) return;
    generateThumbnails();
  }, [pdfDoc, isOpen]);

  const generateThumbnails = async () => {
    const numPages = pdfDoc.numPages;
    for (let i = 1; i <= Math.min(numPages, 20); i++) {
      await generateThumbnail(i);
    }
  };

  const generateThumbnail = async (pageNum) => {
    if (thumbnails[pageNum] || loading[pageNum]) return;
    
    setLoading(prev => ({ ...prev, [pageNum]: true }));
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      setThumbnails(prev => ({ ...prev, [pageNum]: canvas.toDataURL() }));
      page.cleanup();
    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageNum}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [pageNum]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto transform transition-transform">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">Thumbnails</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map(pageNum => (
            <div
              key={pageNum}
              onClick={() => onPageClick(pageNum)}
              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                currentPage === pageNum 
                  ? 'border-green-500 shadow-md' 
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              {thumbnails[pageNum] ? (
                <img
                  src={thumbnails[pageNum]}
                  alt={`Page ${pageNum}`}
                  className="w-full"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
                  <span className="text-sm text-gray-500">Page {pageNum}</span>
                </div>
              )}
              <div className="p-2 text-center text-sm border-t border-gray-100 dark:border-gray-700">
                Page {pageNum}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ThumbnailSidebar;