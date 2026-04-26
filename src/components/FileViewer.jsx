import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getFileById } from '../services/fileService';
import { useAuth } from '../contexts/AuthContext';
import { canAccessFile } from '../services/fileService';

function FileViewer() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canView, setCanView] = useState(false);

  // Get fileId from URL params or query string
  const actualFileId = fileId || searchParams.get('fileId');

  useEffect(() => {
    if (actualFileId) {
      loadFile();
    } else {
      setError('No file specified');
      setLoading(false);
    }
  }, [actualFileId]);

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
      
      // Check if user can access this file
      const hasAccess = await canAccessFile(actualFileId);
      setCanView(hasAccess);
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const getViewerUrl = () => {
    if (!file) return '';
    
    // Google Drive file
    if (file.webViewLink) {
      return file.webViewLink;
    }
    
    // Google Drive ID
    if (actualFileId) {
      return `https://drive.google.com/file/d/${actualFileId}/preview`;
    }
    
    return '';
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
        <button
          onClick={handleGoBack}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
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
          <button
            onClick={handleGoBack}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            ← Back
          </button>
          <span className="text-sm font-medium truncate max-w-md">
            {file?.name || 'Document Viewer'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {file?.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition"
            >
              Open in Drive
            </a>
          )}
          <button
            onClick={() => window.close()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
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