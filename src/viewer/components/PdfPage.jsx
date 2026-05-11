// src/viewer/components/PdfPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import WatermarkLayer from './WatermarkLayer';
import { VIEWER_CONSTANTS } from '../utils/constants';

const PdfPage = ({ 
  pageNum, 
  pageData, 
  scale, 
  fitMode,
  isVisible,
  onRenderComplete,
  onPositionChange,
  isPreviewMode = false,
  previewLimit = 3,
  userEmail,
  isSubscribed,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const shouldRender = isVisible && pageData?.canvas;

  useEffect(() => {
    if (shouldRender && canvasRef.current && pageData?.canvas) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = pageData.width;
      canvasRef.current.height = pageData.height;
      ctx.drawImage(pageData.canvas, 0, 0);
      setIsRendered(true);
      onRenderComplete?.(pageNum);
    }
  }, [shouldRender, pageData, onRenderComplete, pageNum]);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.parentElement?.getBoundingClientRect();
      if (containerRect) {
        onPositionChange?.(pageNum, rect.top - containerRect.top + rect.height, rect.height);
      }
    }
  }, [pageNum, onPositionChange, isRendered]);

  const isBlurred = isPreviewMode && pageNum > previewLimit;

  return (
    <div
      ref={containerRef}
      className="pdf-page relative flex justify-center my-4"
      style={{
        minHeight: pageData?.height || 200,
      }}
    >
      {shouldRender ? (
        <div className="relative shadow-lg">
          <canvas
            ref={canvasRef}
            className={`pdf-canvas ${isBlurred ? 'filter blur-sm' : ''}`}
            style={{
              width: pageData?.width,
              height: pageData?.height,
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          {(isPreviewMode || !isSubscribed) && (
            <WatermarkLayer
              pageNum={pageNum}
              isPreviewMode={isPreviewMode && pageNum <= previewLimit}
              userEmail={userEmail}
              isSubscribed={isSubscribed}
            />
          )}
          {isBlurred && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-2">🔒 Premium Content</div>
                <div className="text-sm">Subscribe to unlock full access</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="skeleton bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          style={{ width: pageData?.width || 600, height: pageData?.height || 800 }}
        />
      )}
    </div>
  );
};

export default PdfPage;