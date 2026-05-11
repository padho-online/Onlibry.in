// src/viewer/hooks/useZoom.js
import { useState, useCallback, useRef } from 'react';
import { VIEWER_CONSTANTS } from '../utils/constants';

export function useZoom(initialScale = VIEWER_CONSTANTS.DEFAULT_ZOOM) {
  const [scale, setScale] = useState(initialScale);
  const [fitMode, setFitMode] = useState('auto');
  const pinchStartRef = useRef(null);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + VIEWER_CONSTANTS.ZOOM_STEP, VIEWER_CONSTANTS.MAX_ZOOM));
    setFitMode('auto');
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - VIEWER_CONSTANTS.ZOOM_STEP, VIEWER_CONSTANTS.MIN_ZOOM));
    setFitMode('auto');
  }, []);

  const resetZoom = useCallback(() => {
    setScale(VIEWER_CONSTANTS.DEFAULT_ZOOM);
    setFitMode('auto');
  }, []);

  const fitToWidth = useCallback(() => {
    setFitMode('width');
  }, []);

  const fitToPage = useCallback(() => {
    setFitMode('page');
  }, []);

  const handlePinchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartRef.current = { distance, scale };
    }
  }, [scale]);

  const handlePinchMove = useCallback((e) => {
    if (pinchStartRef.current && e.touches.length === 2) {
      const newDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = newDistance - pinchStartRef.current.distance;
      const newScale = pinchStartRef.current.scale + (delta * VIEWER_CONSTANTS.PINCH_ZOOM_SENSITIVITY);
      setScale(Math.min(Math.max(newScale, VIEWER_CONSTANTS.MIN_ZOOM), VIEWER_CONSTANTS.MAX_ZOOM));
      setFitMode('auto');
    }
  }, []);

  const handlePinchEnd = useCallback(() => {
    pinchStartRef.current = null;
  }, []);

  return {
    scale,
    setScale,
    fitMode,
    setFitMode,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth,
    fitToPage,
    pinchHandlers: {
      onTouchStart: handlePinchStart,
      onTouchMove: handlePinchMove,
      onTouchEnd: handlePinchEnd,
    },
  };
}

// export { useZoom };