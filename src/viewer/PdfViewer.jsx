// src/viewer/PdfViewer.jsx
// UPDATED - Preview Mode: 1 visible page + 2 masked pages pattern

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

// Components
import LoadingSkeleton from './components/LoadingSkeleton';

const PdfViewer = ({
  pdfUrl,
  fileName = 'Document',
  isSubscribed = false,
  isPreviewMode = false,
  previewLimit = 3,
  userEmail = null,
  onDownload,
  onPageChange,
  onSubscribe, // Callback when user clicks subscribe from masked page
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const scrollContainerRef = useRef(null);
  const pageElementsRef = useRef({});
  const hasRenderedRef = useRef(false);
  const lastPinchDistanceRef = useRef(0);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfUrl) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading PDF:', pdfUrl);
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        console.log('PDF loaded, pages:', doc.numPages);
        
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadPdf();
    
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfUrl]);

  // 🔥 Check if a page should be visible in preview mode
  const isPageVisibleInPreview = useCallback((pageNum) => {
    if (!isPreviewMode) return true;
    if (isSubscribed) return true;
    
    // Pattern: 1 visible, 2 masked, 1 visible, 2 masked...
    // Pages 1, 4, 7, 10, 13... are visible
    // Pattern: (pageNum - 1) % 3 === 0
    return (pageNum - 1) % 3 === 0;
  }, [isPreviewMode, isSubscribed]);

  // Render a single page
  const renderPageToCanvas = useCallback(async (pageNum, targetScale) => {
    if (!pdfDoc) return null;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const actualScale = targetScale * devicePixelRatio;
      
      const viewport = page.getViewport({ scale: actualScale });
      
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-canvas';
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto';
      canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      canvas.style.borderRadius = '8px';
      canvas.style.backgroundColor = '#fff';
      
      const context = canvas.getContext('2d', { alpha: false });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
        background: 'white',
      }).promise;
      
      page.cleanup();
      return canvas;
      
    } catch (error) {
      console.error(`Failed to render page ${pageNum}:`, error);
      return null;
    }
  }, [pdfDoc]);

  // 🔥 Create masked page (Subscribe overlay)
  const createMaskedPageElement = useCallback((pageNum) => {
    const container = document.createElement('div');
    container.className = 'masked-page';
    container.style.minHeight = '500px';
    container.style.backgroundColor = '#1e293b';
    container.style.borderRadius = '12px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '16px';
    container.style.padding = '40px';
    container.style.margin = '0 auto';
    container.style.width = '100%';
    container.style.position = 'relative';
    
    // Blur background effect
    container.style.backdropFilter = 'blur(8px)';
    container.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
    
    container.innerHTML = `
      <div style="font-size: 64px;">🔒</div>
      <div style="font-size: 20px; font-weight: bold; color: white;">Subscribe to Unlock</div>
      <div style="font-size: 14px; color: #94a3b8; text-align: center; max-width: 300px;">
        Page ${pageNum} is locked. Subscribe to get full access to all pages.
      </div>
      <button class="subscribe-masked-btn" style="margin-top: 16px; padding: 12px 28px; background: #22c55e; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
        🔓 Subscribe Now
      </button>
    `;
    
    const btn = container.querySelector('.subscribe-masked-btn');
    if (btn) {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (onSubscribe) {
          onSubscribe();
        }
      };
    }
    
    return container;
  }, [onSubscribe]);

  // Create watermark element
  const createWatermarkElement = useCallback(() => {
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.textContent = 'Onlibry.in';
    watermark.style.position = 'absolute';
    watermark.style.bottom = '20%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translateX(-50%) rotate(-25deg)';
    watermark.style.fontSize = '56px';
    watermark.style.fontWeight = 'bold';
    watermark.style.color = 'rgba(255,255,255,0.08)';
    watermark.style.whiteSpace = 'nowrap';
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '10';
    return watermark;
  }, []);

  // Calculate responsive scale
  const calculateScale = useCallback((containerWidth) => {
    if (!containerWidth) return 1.2;
    const targetWidth = containerWidth - 48;
    const defaultPdfWidth = 612;
    let scale = targetWidth / defaultPdfWidth;
    scale = Math.max(0.8, Math.min(scale, 1.5));
    return scale;
  }, []);

  // Build all pages
  const buildAllPages = useCallback(async () => {
    if (!pdfDoc || !scrollContainerRef.current) return;
    if (hasRenderedRef.current) return;
    
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const scaleToUse = calculateScale(containerWidth);
    
    console.log('Building PDF pages...');
    hasRenderedRef.current = true;
    
    container.innerHTML = '';
    pageElementsRef.current = {};
    
    for (let i = 1; i <= numPages; i++) {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'page-wrapper';
      pageWrapper.id = `page-${i}`;
      pageWrapper.setAttribute('data-page', i);
      pageWrapper.style.position = 'relative';
      pageWrapper.style.marginBottom = '32px';
      pageWrapper.style.width = '100%';
      pageWrapper.style.display = 'flex';
      pageWrapper.style.flexDirection = 'column';
      pageWrapper.style.alignItems = 'center';
      
      // Page label
      const pageLabel = document.createElement('div');
      pageLabel.className = 'page-label';
      pageLabel.textContent = `Page ${i}`;
      pageLabel.style.textAlign = 'center';
      pageLabel.style.fontSize = '13px';
      pageLabel.style.fontWeight = '500';
      pageLabel.style.color = '#94a3b8';
      pageLabel.style.marginBottom = '10px';
      pageLabel.style.padding = '4px 12px';
      pageLabel.style.backgroundColor = 'rgba(255,255,255,0.1)';
      pageLabel.style.borderRadius = '20px';
      pageLabel.style.display = 'inline-block';
      pageWrapper.appendChild(pageLabel);
      
      const contentContainer = document.createElement('div');
      contentContainer.className = 'page-content';
      contentContainer.style.position = 'relative';
      contentContainer.style.width = '100%';
      contentContainer.style.display = 'flex';
      contentContainer.style.justifyContent = 'center';
      
      // 🔥 Check if page should be visible in preview mode
      const isVisible = isPageVisibleInPreview(i);
      
      if (isVisible) {
        // Render actual page content
        const canvas = await renderPageToCanvas(i, scaleToUse);
        if (canvas) {
          contentContainer.appendChild(canvas);
          
          // Add watermark for non-subscribers in preview mode
          if (isPreviewMode && !isSubscribed) {
            const watermark = createWatermarkElement();
            contentContainer.appendChild(watermark);
          }
        }
      } else {
        // Show masked page (subscribe overlay)
        const maskedContent = createMaskedPageElement(i);
        contentContainer.appendChild(maskedContent);
      }
      
      pageWrapper.appendChild(contentContainer);
      container.appendChild(pageWrapper);
      pageElementsRef.current[i] = pageWrapper;
    }
    
    console.log('Pages built successfully');
  }, [pdfDoc, numPages, calculateScale, isPageVisibleInPreview, isPreviewMode, isSubscribed, renderPageToCanvas, createMaskedPageElement, createWatermarkElement]);

  // Build pages when PDF loads
  useEffect(() => {
    if (pdfDoc && numPages > 0 && scrollContainerRef.current && !hasRenderedRef.current) {
      setTimeout(() => {
        buildAllPages();
      }, 100);
    }
  }, [pdfDoc, numPages, buildAllPages]);

  // Handle scroll to detect current page
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      let visiblePage = 1;
      for (let i = 1; i <= numPages; i++) {
        const element = document.getElementById(`page-${i}`);
        if (element) {
          const offsetTop = element.offsetTop;
          if (offsetTop <= scrollTop + containerHeight / 2) {
            visiblePage = i;
          } else {
            break;
          }
        }
      }
      
      if (visiblePage !== currentPage) {
        setCurrentPage(visiblePage);
        if (onPageChange) onPageChange(visiblePage);
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      setTimeout(handleScroll, 200);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [numPages, currentPage, onPageChange]);

  // Zoom via Ctrl + Mouse Wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Zoom via Ctrl + + / Ctrl + -
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setScale(prev => Math.min(prev + 0.1, 3));
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setScale(prev => Math.max(prev - 0.1, 0.5));
      } else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setScale(1.2);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pinch zoom for touch devices
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastPinchDistanceRef.current = distance;
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && lastPinchDistanceRef.current > 0) {
        e.preventDefault();
        const newDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const zoomDelta = (newDistance - lastPinchDistanceRef.current) / 100;
        setScale(prev => Math.min(Math.max(prev + zoomDelta, 0.5), 3));
        lastPinchDistanceRef.current = newDistance;
      }
    };
    
    const handleTouchEnd = () => {
      lastPinchDistanceRef.current = 0;
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  // Handle resize
  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        hasRenderedRef.current = false;
        buildAllPages();
      }, 500);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [buildAllPages]);

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload();
    }
  };

  // Apply dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#f1f5f9';
    
    return () => {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-white mb-2">Failed to Load PDF</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-green-600 text-white rounded-lg">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pdf-viewer flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="text-sm font-medium text-slate-300">
          Page <span className="font-bold text-white">{currentPage}</span> of {numPages}
        </div>
        
        {/* Zoom Hint */}
        <div className="text-xs text-slate-400 hidden sm:block">
          
        </div>
        
        {/* Download Button - Only for premium subscribers */}
        {!isPreviewMode && isSubscribed && onDownload && (
          <button
            onClick={handleDownloadClick}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
          >
            ⬇️ Download
          </button>
        )}
        
        {/* Preview Mode Indicator */}
        {isPreviewMode && !isSubscribed && (
          <div className="text-xs bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full">
            🔍 Preview Mode
          </div>
        )}
      </div>
      
      {/* Scrollable Pages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{
          maxHeight: 'calc(100vh - 70px)',
        }}
      />
      
      {/* Mobile Page Indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium z-20 shadow-lg md:hidden">
        {currentPage} / {numPages}
      </div>
    </div>
  );
};

export default PdfViewer;