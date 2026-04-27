import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getFileById } from '../services/fileService';
import { useAuth } from '../contexts/AuthContext';
import { canAccessFile } from '../services/fileService';
import { logFileView } from '../services/loggerService';

function FileViewer() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canView, setCanView] = useState(false);
  
  // Time tracking states
  const [viewStartTime, setViewStartTime] = useState(null);
  const [viewDuration, setViewDuration] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(true);
  const [viewLogged, setViewLogged] = useState(false);
  const durationIntervalRef = useRef(null);

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

  // Start time tracking when file is loaded and viewable
  useEffect(() => {
    if (!loading && canView && file && !viewLogged) {
      setViewLogged(true);
      const startTime = Date.now();
      setViewStartTime(startTime);
      
      console.log('⏱️ File view started at:', new Date(startTime).toLocaleTimeString());
      
      logFileView(
        actualFileId,
        file?.name || 'Unknown',
        file?.isPremium || false,
        true,
        0,
        'started'
      );
      
      durationIntervalRef.current = setInterval(() => {
        if (isViewerVisible && !loading) {
          const currentDuration = Math.floor((Date.now() - startTime) / 1000);
          setViewDuration(currentDuration);
          
          if (currentDuration > 0 && currentDuration % 30 === 0) {
            console.log(`⏱️ User has viewed for ${currentDuration} seconds`);
            logFileView(
              actualFileId,
              file?.name || 'Unknown',
              file?.isPremium || false,
              true,
              currentDuration,
              'in_progress'
            );
          }
        }
      }, 1000);
      
      return () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      };
    }
  }, [loading, canView, file, isViewerVisible]);

  // Track page visibility (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsViewerVisible(isVisible);
      
      if (isVisible && viewStartTime && !loading) {
        const elapsed = Math.floor((Date.now() - viewStartTime) / 1000);
        console.log(`👁️ Tab visible again, viewed ${elapsed} seconds so far`);
      } else if (!isVisible && viewStartTime) {
        console.log('👁️ Tab hidden, pausing duration tracking');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewStartTime, loading]);

  // Log final duration when user leaves/closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (viewStartTime && file && canView) {
        const finalDuration = Math.floor((Date.now() - viewStartTime) / 1000);
        console.log(`⏱️ FINAL: User viewed for ${finalDuration} seconds`);
        
        logFileView(
          actualFileId,
          file?.name || 'Unknown',
          file?.isPremium || false,
          true,
          finalDuration,
          'completed'
        );
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (viewStartTime && file && canView) {
        const finalDuration = Math.floor((Date.now() - viewStartTime) / 1000);
        if (finalDuration > 0) {
          console.log(`⏱️ FINAL (unmount): User viewed for ${finalDuration} seconds`);
          logFileView(
            actualFileId,
            file?.name || 'Unknown',
            file?.isPremium || false,
            true,
            finalDuration,
            'completed'
          );
        }
      }
    };
  }, [viewStartTime, file, canView, actualFileId]);

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
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const getViewerUrl = () => {
    if (!file) return '';
    
    if (file.webViewLink) {
      return file.webViewLink;
    }
    
    if (actualFileId) {
      return `https://drive.google.com/file/d/${actualFileId}/preview`;
    }
    
    return '';
  };

  const handlePurchase = () => {
    navigate('/pricing', { state: { from: `/viewer/${actualFileId}`, fileId: actualFileId } });
  };

  const handleGoBack = () => {
    // Log duration before going back
    if (viewStartTime && file && canView) {
      const finalDuration = Math.floor((Date.now() - viewStartTime) / 1000);
      logFileView(
        actualFileId,
        file?.name || 'Unknown',
        file?.isPremium || false,
        true,
        finalDuration,
        'completed'
      );
    }
    navigate(-1);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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
        <div className="flex items-center gap-3">
          {viewDuration > 0 && (
            <span className="text-xs bg-gray-700 px-2 py-1 rounded-lg">
              ⏱️ Reading: {formatDuration(viewDuration)}
            </span>
          )}
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
            onClick={handleGoBack}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            ✕ Close
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