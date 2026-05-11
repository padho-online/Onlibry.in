// src/viewer/components/Toolbar.jsx
import React, { useState } from 'react';
import { VIEWER_CONSTANTS } from '../utils/constants';

const Toolbar = ({
  currentPage,
  numPages,
  scale,
  zoomIn,
  zoomOut,
  fitToWidth,
  fitToPage,
  resetZoom,
  onPageChange,
  onDownload,
  onFullscreen,
  isFullscreen,
  onSearch,
  searchQuery,
  searchResults,
  currentResultIndex,
  onNextResult,
  onPrevResult,
  isDarkMode,
  onToggleDarkMode,
  showDownload = true,
  isSubscribed = false,
}) => {
  const [pageInput, setPageInput] = useState(currentPage);

  const handlePageSubmit = (e) => {
    e.preventDefault();
    let page = parseInt(pageInput);
    if (isNaN(page)) page = 1;
    page = Math.max(1, Math.min(page, numPages));
    onPageChange(page);
    setPageInput(page);
  };

  const formatZoomPercent = () => {
    return `${Math.round(scale * 100)}%`;
  };

  return (
    <div className="toolbar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20 shadow-sm">
      {/* Left section - Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          ← Prev
        </button>
        
        <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
          <input
            type="number"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            min={1}
            max={numPages}
            className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">/ {numPages}</span>
        </form>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= numPages}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      {/* Center section - Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={zoomOut}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Zoom out"
          title="Zoom Out"
        >
          −
        </button>
        
        <span className="text-sm font-mono min-w-[60px] text-center">
          {formatZoomPercent()}
        </span>
        
        <button
          onClick={zoomIn}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Zoom in"
          title="Zoom In"
        >
          +
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <button
          onClick={fitToWidth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
          title="Fit to Width"
        >
          📐 Width
        </button>
        
        <button
          onClick={fitToPage}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
          title="Fit to Page"
        >
          📄 Page
        </button>
        
        <button
          onClick={resetZoom}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
          title="Reset Zoom"
        >
          100%
        </button>
      </div>

      {/* Right section - Utilities */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            className="px-3 py-1.5 pl-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {searchResults.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {currentResultIndex + 1}/{searchResults.length}
            </div>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <>
            <button
              onClick={onPrevResult}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Previous result"
            >
              ↑
            </button>
            <button
              onClick={onNextResult}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Next result"
            >
              ↓
            </button>
          </>
        )}
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        {/* Dark mode toggle */}
        <button
  onClick={onToggleDarkMode}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
  title={isDarkMode ? 'Light mode' : 'Dark mode'}
>
  {isDarkMode ? '☀️' : '🌙'}
</button>
        {/* Fullscreen */}
        <button
          onClick={onFullscreen}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? '🗗' : '🗖'}
        </button>
        
        {/* Download (only for subscribed users) */}
        {showDownload && isSubscribed && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={onDownload}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm"
              title="Download PDF"
            >
              ⬇️ Download
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;