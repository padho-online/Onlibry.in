import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getFileById, canAccessFile } from '../services/fileService';
import { useAuth } from '../contexts/AuthContext';
import { logFileViewStart, logFileViewClose } from '../services/loggerService';

function FileViewer() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canView, setCanView] = useState(false);

  const actualFileId = fileId || searchParams.get('fileId');

  // ✅ Effect 1: Load file
  useEffect(() => {
    if (actualFileId) {
      loadFile();
    } else {
      setError('No file specified');
      setLoading(false);
    }
    
    return () => {
      logFileViewClose();
    };
  }, [actualFileId]);

  // ✅ Effect 2: CSS Injection to hide Google Drive download button
  useEffect(() => {
    if (!canView) return;
    
    // Inject CSS to hide download buttons in Google Drive iframe
    const style = document.createElement('style');
    style.id = 'drive-hide-download-css';
    style.textContent = `
      /* Hide Google Drive download buttons */
      .ndfHFb-c4YZDc-Wrql6b,
      .ndfHFb-c4YZDc-Wrql6b-LgbsSe,
      .uHMk6b fsHoPb,
      .J9UWEb,
      .V2CwNc,
      .V2CwNc-BI52fc,
      [aria-label="Download"],
      [aria-label="Download file"],
      [aria-label="Download this file"],
      button[aria-label="Download"],
      button[aria-label="Download file"],
      .drive-toolbar-download-button,
      .drive-viewer-download-button,
      [data-tooltip="Download"],
      .goog-menuitem[aria-label="Download"],
      .docs-download-button {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* Hide print button too */
      [aria-label="Print"],
      button[aria-label="Print"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Also try to hide after iframe loads
    const hideButtonsInIframe = setInterval(() => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentDocument) {
        try {
          const iframeDoc = iframe.contentDocument;
          const buttons = iframeDoc.querySelectorAll('[aria-label="Download"], .ndfHFb-c4YZDc-Wrql6b');
          buttons.forEach(btn => {
            btn.style.display = 'none';
          });
        } catch (e) {
          // Cross-origin iframe can't be accessed - that's fine
        }
      }
    }, 1000);
    
    return () => {
      const existingStyle = document.getElementById('drive-hide-download-css');
      if (existingStyle) existingStyle.remove();
      clearInterval(hideButtonsInIframe);
    };
  }, [canView]);

  const loadFile = async () => {
    setLoading(true);
    try {
      const fileData = await getFileById(actualFileId);
      
      if (!fileData) {
        setError('File not found');
        setLoading(false);
        return;
      }
      
      setFile(fileData);
      
      const hasAccess = await canAccessFile(actualFileId);
      setCanView(hasAccess);
      
      if (hasAccess) {
        logFileViewStart(actualFileId, fileData.name, fileData.isPremium, hasAccess);
      }
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const getViewerUrl = () => {
    if (!file) return '';
    
    // For PDF - use Google Docs Viewer (no download)
    if (file.name?.endsWith('.pdf') || file.mimeType === 'application/pdf') {
      const driveUrl = file.webViewLink || `https://drive.google.com/file/d/${actualFileId}/view`;
      return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(driveUrl)}`;
    }
    
    // Default Drive embed
    if (file.webViewLink) {
      return file.webViewLink;
    }
    
    return `https://drive.google.com/file/d/${actualFileId}/preview`;
  };

  const handlePurchase = () => {
    navigate('/pricing', { state: { from: `/viewer/${actualFileId}`, fileId: actualFileId } });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{error}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The file you're looking for doesn't exist or has been removed.</p>
        <button onClick={handleGoBack} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Go Back
        </button>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Premium Content</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This file is only available for premium subscribers.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {file?.name}
        </p>
        <button
          onClick={handlePurchase}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700"
        >
          Upgrade to Premium
        </button>
        <button
          onClick={handleGoBack}
          className="ml-3 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={handleGoBack} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            ← Back
          </button>
          <span className="text-sm font-medium truncate max-w-md">
            {file?.name || 'Document Viewer'}
          </span>
        </div>
        
        {/* NO DOWNLOAD BUTTON - Intentionally removed */}
        <button onClick={() => window.close()} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition">
          Close
        </button>
      </div>
      
      {/* Viewer */}
      <div className="flex-1 p-2">
        <iframe
          src={getViewerUrl()}
          className="w-full h-full rounded-lg"
          title={file?.name || 'File Viewer'}
          allow="autoplay; fullscreen"
          frameBorder="0"
        />
      </div>
    </div>
  );
}

export default FileViewer;