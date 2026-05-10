// src/components/SecurePDFViewer.jsx
// COMPLETE - PDF viewer with iframe and security

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function SecurePDFViewer({ fileUrl, fileName, showDownloadButton = false, onDownload, isPremium = false, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const disableRightClick = (e) => {
      e.preventDefault();
      return false;
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', disableRightClick);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('contextmenu', disableRightClick);
      }
    };
  }, []);

  useEffect(() => {
    const disableKeyboardShortcuts = (e) => {
      if ((e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) ||
          (e.ctrlKey && e.shiftKey && e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
        alert('Printing and saving are disabled');
        return false;
      }
    };
    
    window.addEventListener('keydown', disableKeyboardShortcuts);
    return () => window.removeEventListener('keydown', disableKeyboardShortcuts);
  }, []);

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    const iframe = document.querySelector('#pdf-iframe');
    if (iframe) {
      iframe.src = fileUrl;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900" ref={containerRef}>
      <div className="bg-gray-900 text-white p-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGoBack} 
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
          >
            ← Back
          </button>
          <span className="text-sm font-medium truncate max-w-md">
            {fileName || 'Document Viewer'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {showDownloadButton && (
            <button
              onClick={onDownload}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
            >
              ⬇️ Download
            </button>
          )}
          <button 
            onClick={() => window.close()} 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-950">
        {loading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 z-10">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex justify-center items-center bg-gray-100 dark:bg-gray-900 z-10">
            <div className="text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-3"
              >
                🔄 Retry
              </button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
              >
                📖 Open in Browser
              </a>
            </div>
          </div>
        )}
          
        <iframe
          id="pdf-iframe"
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0"
          title={fileName || 'PDF Viewer'}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('Failed to load PDF. Please try again.');
          }}
        />
      </div>
      
      {!showDownloadButton && !error && (
        <div className="bg-gray-800 text-white text-center py-1 text-xs">
          🔒 Download only available for premium users
        </div>
      )}
    </div>
  );
}

export default SecurePDFViewer;