// src/viewer/PdfViewer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Components
import Toolbar from './components/Toolbar';
import PdfPage from './components/PdfPage';
import ThumbnailSidebar from './components/ThumbnailSidebar';
import OutlineNavigation from './components/OutlineNavigation';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';

// Hooks
import { usePdfDocument } from './hooks/usePdfDocument';
import { usePdfPages } from './hooks/usePdfPages';
import { useZoom } from './hooks/useZoom';
import { useSearch } from './hooks/useSearch';
import { useFullscreen } from './hooks/useFullscreen';
import { useVirtualScroll } from './hooks/useVirtualScroll';
import { useTouchGestures } from './hooks/useTouchGestures';

// Utils
import { VIEWER_CONSTANTS, PREVIEW_LIMITS } from './utils/constants';
import { getFitToWidthScale, getFitToPageScale, isMobile } from './utils/renderingUtils';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfViewer = ({
  pdfUrl,
  fileName = 'Document',
  isSubscribed = false,
  isPreviewMode = false,
  previewLimit = PREVIEW_LIMITS.MAX_PAGES,
  userEmail = null,
  onDownload,
  onPageChange,
  className = '',
}) => {
  // State
  const [containerWidth, setContainerWidth] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // Refs
  const containerRef = useRef(null);
  const pagesContainerRef = useRef(null);
  
  // Hooks
  const { pdfDoc, numPages, loading, error, metadata } = usePdfDocument(pdfUrl);
  const { scale, fitMode, setScale, zoomIn, zoomOut, resetZoom, fitToWidth, fitToPage, pinchHandlers } = useZoom();
  const { pages, renderingPages, visiblePages, setVisiblePages, queueRenderPage, cleanupPages, registerPagePosition } = usePdfPages(pdfDoc, scale, isPreviewMode, previewLimit);
  const { searchQuery, searchResults, currentResultIndex, debouncedSearch, goToNextResult, goToPrevResult, clearSearch } = useSearch(pdfDoc);
  const { isFullscreen, toggleFullscreen, fullscreenRef, onFullscreenChange } = useFullscreen();
  const { visibleRange, currentPage, registerPagePosition: registerVirtualPosition, handleScroll, scrollToPage } = useVirtualScroll(numPages, (page) => {
    onPageChange?.(page);
  }, pagesContainerRef);
  const { touchHandlers } = useTouchGestures(
    () => scrollToPage(currentPage + 1),
    () => scrollToPage(currentPage - 1)
  );
  
  // Track container width for fit modes
  useEffect(() => {
    if (!pagesContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    resizeObserver.observe(pagesContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  // Apply fit modes
  useEffect(() => {
    if (!pdfDoc || !containerWidth || !pages[1]) return;
    
    if (fitMode === 'width') {
      const page = pages[1];
      const newScale = getFitToWidthScale(containerWidth - 48, page.width);
      setScale(Math.min(Math.max(newScale, VIEWER_CONSTANTS.MIN_ZOOM), VIEWER_CONSTANTS.MAX_ZOOM));
    } else if (fitMode === 'page' && viewportSize.height) {
      const page = pages[1];
      const newScale = getFitToPageScale(viewportSize.height - 100, page.height, containerWidth - 48, page.width);
      setScale(Math.min(Math.max(newScale, VIEWER_CONSTANTS.MIN_ZOOM), VIEWER_CONSTANTS.MAX_ZOOM));
    }
  }, [fitMode, containerWidth, pdfDoc, pages, setScale, viewportSize]);
  
  // Update viewport size
  useEffect(() => {
    if (!pagesContainerRef.current) return;
    const rect = pagesContainerRef.current.getBoundingClientRect();
    setViewportSize({ width: rect.width, height: rect.height });
  }, []);
  
  // Queue pages for rendering based on visible range
  useEffect(() => {
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      queueRenderPage(i);
    }
    
    // Cleanup pages outside visible range
    const keepPages = [];
    for (let i = Math.max(1, visibleRange.start - 5); i <= Math.min(numPages, visibleRange.end + 5); i++) {
      keepPages.push(i);
    }
    cleanupPages(keepPages);
  }, [visibleRange, queueRenderPage, cleanupPages, numPages]);
  
  // Handle fullscreen change
  useEffect(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [onFullscreenChange]);
  
  // Apply dark mode to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const handlePageChange = useCallback((page) => {
    scrollToPage(page);
  }, [scrollToPage]);
  
  const handleDownload = () => {
    if (onDownload && isSubscribed) {
      onDownload();
    }
  };
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Failed to Load PDF</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-green-600 text-white rounded-lg">
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div 
      ref={fullscreenRef}
      className={`pdf-viewer flex flex-col h-full bg-gray-100 dark:bg-gray-900 ${className}`}
      {...touchHandlers}
    >
      {/* Toolbar */}
      <Toolbar
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        fitToWidth={fitToWidth}
        fitToPage={fitToPage}
        resetZoom={resetZoom}
        onPageChange={handlePageChange}
        onDownload={handleDownload}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onSearch={debouncedSearch}
        searchQuery={searchQuery}
        searchResults={searchResults}
        currentResultIndex={currentResultIndex}
        onNextResult={goToNextResult}
        onPrevResult={goToPrevResult}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        showDownload={true}
        isSubscribed={isSubscribed}
      />
      
      {/* Sidebar Toggle Buttons */}
      <div className="fixed left-4 bottom-20 z-20 flex flex-col gap-2">
        <button
          onClick={() => setShowThumbnails(!showThumbnails)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title="Thumbnails"
        >
          🖼️
        </button>
        {metadata?.Outline && (
          <button
            onClick={() => setShowOutline(!showOutline)}
            className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Table of Contents"
          >
            📑
          </button>
        )}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title="Search"
        >
          🔍
        </button>
      </div>
      
      {/* Sidebars */}
      <ThumbnailSidebar
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        onPageClick={handlePageChange}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
      />
      
      <OutlineNavigation
        pdfDoc={pdfDoc}
        onNavigate={handlePageChange}
        isOpen={showOutline}
        onClose={() => setShowOutline(false)}
      />
      
      <SearchBar
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          clearSearch();
        }}
        searchQuery={searchQuery}
        onSearch={debouncedSearch}
        searchResults={searchResults}
        currentResultIndex={currentResultIndex}
        onNextResult={goToNextResult}
        onPrevResult={goToPrevResult}
        isSearching={false}
      />
      
      {/* Pages Container */}
      <div
        ref={pagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-8"
        onScroll={handleScroll}
      >
        <div className="flex flex-col items-center">
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
            <PdfPage
              key={pageNum}
              pageNum={pageNum}
              pageData={pages[pageNum]}
              scale={scale}
              fitMode={fitMode}
              isVisible={pageNum >= visibleRange.start && pageNum <= visibleRange.end}
              onRenderComplete={() => {}}
              onPositionChange={registerVirtualPosition}
              isPreviewMode={isPreviewMode}
              previewLimit={previewLimit}
              userEmail={userEmail}
              isSubscribed={isSubscribed}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;