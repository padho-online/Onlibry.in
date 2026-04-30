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
  const [viewerUrl, setViewerUrl] = useState('');

  const actualFileId = fileId || searchParams.get('fileId');

  // Effect 1: Load file
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

  // Effect 2: CSS Injection to hide Google Drive download button
  useEffect(() => {
    if (!canView) return;
    
    // Inject CSS to hide download buttons
    const style = document.createElement('style');
    style.id = 'drive-hide-download-css';
    style.textContent = `
      .ndfHFb-c4YZDc-Wrql6b,
      .ndfHFb-c4YZDc-Wrql6b-LgbsSe,
      .uHMk6b fsHoPb,
      .J9UWEb,
      .V2CwNc,
      [aria-label="Download"],
      [aria-label="Download file"],
      button[aria-label="Download"],
      .drive-toolbar-download-button,
      .goog-menuitem[aria-label="Download"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('drive-hide-download-css');
      if (existingStyle) existingStyle.remove();
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
        
        // Set viewer URL based on file type
        let url = '';
        
        // For PDF files - use Google Drive embed with parameters
        if (fileData.name?.endsWith('.pdf') || fileData.mimeType === 'application/pdf') {
          // Direct Drive embed - no extra params
          url = `https://drive.google.com/file/d/${actualFileId}/preview`;
        } 
        // For images
        else if (fileData.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          url = `https://drive.google.com/uc?id=${actualFileId}&export=view`;
        }
        // For other files (docs, sheets, slides)
        else if (fileData.webViewLink) {
          url = fileData.webViewLink;
        }
        // Fallback
        else {
          url = `https://drive.google.com/file/d/${actualFileId}/preview`;
        }
        
        setViewerUrl(url);
      }
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
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
        
        {/* Close button only - NO DOWNLOAD BUTTON */}
        <button onClick={() => window.close()} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition">
          Close
        </button>
      </div>
      
      {/* Viewer */}
      <div className="flex-1 p-2">
        {viewerUrl ? (
          <iframe
            src={viewerUrl}
            className="w-full h-full rounded-lg"
            title={file?.name || 'File Viewer'}
            allow="autoplay; fullscreen"
            frameBorder="0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-gray-500">File preview not available</p>
            <a 
              href={file?.webViewLink || `https://drive.google.com/file/d/${actualFileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Open in Google Drive
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileViewer;