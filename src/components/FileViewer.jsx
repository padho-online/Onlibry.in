import React, { useEffect, useRef } from 'react';

function FileViewer({ file, onClose }) {
  const modalRef = useRef();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  const getViewerUrl = () => {
    if (file.webViewLink) return file.webViewLink;
    if (file.fileId) return `https://drive.google.com/file/d/${file.fileId}/preview`;
    return '';
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white truncate flex-1">
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>
        
        {/* Viewer */}
        <div className="flex-1 p-2">
          <iframe
            src={getViewerUrl()}
            className="w-full h-full rounded-lg"
            title={file.name}
            allow="autoplay"
          />
        </div>
      </div>
    </div>
  );
}

export default FileViewer;