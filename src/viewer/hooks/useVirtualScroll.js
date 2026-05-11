// src/viewer/hooks/useVirtualScroll.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { VIEWER_CONSTANTS } from '../utils/constants';
import { throttle } from '../utils/renderingUtils';

export function useVirtualScroll(totalPages, onPageChange, containerRef) {
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const pagePositions = useRef({});
  const isScrolling = useRef(false);

  const updateVisiblePages = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const buffer = VIEWER_CONSTANTS.VIRTUAL_SCROLL_BUFFER;
    
    let startPage = 1;
    let endPage = totalPages;
    
    for (let i = 1; i <= totalPages; i++) {
      const position = pagePositions.current[i];
      if (position && position.top + position.height > scrollTop) {
        startPage = Math.max(1, i - buffer);
        break;
      }
    }
    
    const scrollBottom = scrollTop + containerHeight;
    for (let i = startPage; i <= totalPages; i++) {
      const position = pagePositions.current[i];
      if (position && position.top > scrollBottom) {
        endPage = Math.min(totalPages, i + buffer);
        break;
      }
    }
    
    setVisibleRange({ start: startPage, end: endPage });
    
    let centerPage = startPage;
    for (let i = startPage; i <= endPage; i++) {
      const position = pagePositions.current[i];
      if (position && position.top + position.height / 2 > scrollTop) {
        centerPage = i;
        break;
      }
    }
    
    if (centerPage !== currentPage) {
      setCurrentPage(centerPage);
      onPageChange?.(centerPage);
    }
  }, [totalPages, currentPage, onPageChange, containerRef]);

  const registerPagePosition = useCallback((pageNum, top, height) => {
    pagePositions.current[pageNum] = { top, height };
    if (!isScrolling.current) {
      requestAnimationFrame(() => updateVisiblePages());
    }
  }, [updateVisiblePages]);

  const handleScroll = useCallback(throttle(() => {
    isScrolling.current = true;
    updateVisiblePages();
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, 100), [updateVisiblePages]);

  const scrollToPage = useCallback((pageNum) => {
    const position = pagePositions.current[pageNum];
    if (position && containerRef.current) {
      containerRef.current.scrollTo({
        top: position.top,
        behavior: 'smooth',
      });
    }
  }, [containerRef]);

  return {
    visibleRange,
    currentPage,
    registerPagePosition,
    handleScroll,
    scrollToPage,
  };
}

// export { useVirtualScroll };