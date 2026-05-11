// src/viewer/components/WatermarkLayer.jsx
import React, { useMemo } from 'react';
import { VIEWER_CONSTANTS } from '../utils/constants';

const WatermarkLayer = ({ pageNum, isPreviewMode, userEmail, isSubscribed }) => {
  const shouldShowWatermark = useMemo(() => {
    if (isSubscribed) return false;
    if (isPreviewMode) return true;
    return true;
  }, [isSubscribed, isPreviewMode]);

  if (!shouldShowWatermark) return null;

  const watermarkText = isPreviewMode 
    ? 'PREVIEW ONLY - Onlibry.in'
    : `Onlibry.in${userEmail ? ` • ${userEmail}` : ''}`;

  return (
    <div className="watermark-layer absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Diagonal repeating watermark */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `rotate(${VIEWER_CONSTANTS.WATERMARK_ROTATION}deg)`,
          opacity: VIEWER_CONSTANTS.WATERMARK_OPACITY,
        }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400 whitespace-nowrap">
            {watermarkText}
          </div>
          {isPreviewMode && (
            <div className="text-sm text-gray-400 mt-2">
              First {pageNum} of 3 preview pages
            </div>
          )}
        </div>
      </div>
      
      {/* Footer watermark for preview mode */}
      {isPreviewMode && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 py-2 text-center text-xs text-gray-500 border-t border-gray-200">
          📚 This is a preview. Purchase full version at Onlibry.in
        </div>
      )}
    </div>
  );
};

export default WatermarkLayer;