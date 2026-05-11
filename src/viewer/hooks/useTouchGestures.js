// src/viewer/hooks/useTouchGestures.js
import { useRef, useCallback } from 'react';
import { VIEWER_CONSTANTS } from '../utils/constants';

export function useTouchGestures(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (e.changedTouches.length === 1) {
      touchEnd.current = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };
      
      const deltaX = touchStart.current.x - touchEnd.current.x;
      const deltaY = touchStart.current.y - touchEnd.current.y;
      
      if (Math.abs(deltaX) > VIEWER_CONSTANTS.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight]);

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

// ❌ REMOVE THIS LINE - it's causing duplicate export
// export { useTouchGestures };