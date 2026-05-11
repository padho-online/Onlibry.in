// src/viewer/hooks/useFullscreen.js
import { useState, useCallback, useRef } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    if (!elementRef.current) return;
    
    if (!isFullscreen) {
      if (elementRef.current.requestFullscreen) {
        elementRef.current.requestFullscreen();
      } else if (elementRef.current.webkitRequestFullscreen) {
        elementRef.current.webkitRequestFullscreen();
      } else if (elementRef.current.msRequestFullscreen) {
        elementRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    fullscreenRef: elementRef,
    onFullscreenChange: handleFullscreenChange,
  };
}

// export { useFullscreen };