// src/viewer/hooks/usePdfPages.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { VIEWER_CONSTANTS } from '../utils/constants';
import { cleanupCanvas } from '../utils/renderingUtils';

export function usePdfPages(pdfDoc, scale, isPreviewMode = false, previewLimit = 3) {
  const [pages, setPages] = useState({});
  const [renderingPages, setRenderingPages] = useState(new Set());
  const renderQueue = useRef([]);
  const isRendering = useRef(false);
  const scaleRef = useRef(scale);
  const isMounted = useRef(true);

  // Cleanup on unmount - cleanup all canvases
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup all canvases
      Object.values(pages).forEach(page => {
        if (page?.canvas) {
          cleanupCanvas(page.canvas);
        }
      });
    };
  }, [pages]);

  const renderPage = useCallback(async (pageNum) => {
    if (!pdfDoc || !isMounted.current) return;
    if (pages[pageNum] || renderingPages.has(pageNum)) return;
    
    // Preview mode: don't render beyond limit
    if (isPreviewMode && pageNum > previewLimit) return;
    
    setRenderingPages(prev => {
      const newSet = new Set(prev);
      newSet.add(pageNum);
      return newSet;
    });
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      if (isMounted.current) {
        setPages(prev => ({
          ...prev,
          [pageNum]: { canvas, width: viewport.width, height: viewport.height }
        }));
      }
      
      page.cleanup();
      
    } catch (error) {
      console.error(`Failed to render page ${pageNum}:`, error);
    } finally {
      if (isMounted.current) {
        setRenderingPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(pageNum);
          return newSet;
        });
      }
    }
  }, [pdfDoc, scale, pages, renderingPages, isPreviewMode, previewLimit]);

  const processRenderQueue = useCallback(async () => {
    if (!isMounted.current) return;
    if (isRendering.current || renderQueue.current.length === 0) return;
    
    isRendering.current = true;
    
    while (renderQueue.current.length > 0 && isMounted.current) {
      const pageNum = renderQueue.current.shift();
      await renderPage(pageNum);
    }
    
    isRendering.current = false;
  }, [renderPage]);

  const queueRenderPage = useCallback((pageNum) => {
    if (!isMounted.current) return;
    if (!pages[pageNum] && !renderingPages.has(pageNum) && !renderQueue.current.includes(pageNum)) {
      renderQueue.current.push(pageNum);
      processRenderQueue();
    }
  }, [pages, renderingPages, processRenderQueue]);

  const cleanupPages = useCallback((keepPages) => {
    if (!isMounted.current) return;
    const keepSet = new Set(keepPages);
    setPages(prev => {
      const newPages = { ...prev };
      Object.keys(newPages).forEach(pageNum => {
        const pageNumInt = parseInt(pageNum);
        if (!keepSet.has(pageNumInt)) {
          const page = newPages[pageNumInt];
          if (page && page.canvas) {
            cleanupCanvas(page.canvas);
          }
          delete newPages[pageNumInt];
        }
      });
      return newPages;
    });
  }, []);

  // Only clear pages when scale actually changes significantly
  useEffect(() => {
    if (Math.abs(scaleRef.current - scale) > 0.01 && Object.keys(pages).length > 0) {
      // Clear all pages when scale changes
      setPages({});
      renderQueue.current = [];
      scaleRef.current = scale;
    }
  }, [scale, pages]);

  return {
    pages,
    renderingPages,
    queueRenderPage,
    cleanupPages,
  };
}