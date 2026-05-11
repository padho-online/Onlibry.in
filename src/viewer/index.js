// src/viewer/index.js
export { default as PdfViewer } from './PdfViewer';
export { default as PdfPage } from './components/PdfPage';
export { default as Toolbar } from './components/Toolbar';
export { default as WatermarkLayer } from './components/WatermarkLayer';
export { default as ThumbnailSidebar } from './components/ThumbnailSidebar';
export { default as OutlineNavigation } from './components/OutlineNavigation';
export { default as SearchBar } from './components/SearchBar';
export { default as LoadingSkeleton } from './components/LoadingSkeleton';

// Hooks
export { usePdfDocument } from './hooks/usePdfDocument';
export { usePdfPages } from './hooks/usePdfPages';
export { useZoom } from './hooks/useZoom';
export { useSearch } from './hooks/useSearch';
export { useFullscreen } from './hooks/useFullscreen';
export { useVirtualScroll } from './hooks/useVirtualScroll';
export { useTouchGestures } from './hooks/useTouchGestures';

// Utils
export { VIEWER_CONSTANTS, PREVIEW_LIMITS } from './utils/constants';