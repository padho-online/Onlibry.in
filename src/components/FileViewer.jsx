// src/components/FileViewer.jsx
// FIXED - Direct URL without fetch test

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFileById } from '../services/fileService';
import SecurePDFViewer from './SecurePDFViewer';

const WORKER_URL = 'https://onlibry.mdhabibul12212141.workers.dev';

function FileViewer() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [canView, setCanView] = useState(false);

  const actualFileId = fileId || searchParams.get('fileId');

  useEffect(() => {
    if (actualFileId) {
      loadFile();
    } else {
      setError('No file specified');
      setLoading(false);
    }
  }, [actualFileId, isSubscribed]);

  const loadFile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fileData = await getFileById(actualFileId);
      
      if (!fileData) {
        setError('File not found');
        setLoading(false);
        return;
      }
      
      setFile(fileData);
      
      // Check access
      const hasAccess = !fileData.isPremium || (fileData.isPremium && isSubscribed);
      
      if (!hasAccess) {
        setCanView(false);
        setLoading(false);
        return;
      }
      
      setCanView(true);
      
      const workerFileId = fileData.cloudflareKey || fileData.id;
      // Direct URL - no fetch test
      const viewUrl = `${WORKER_URL}/view/${workerFileId}`;
      
      setPdfUrl(viewUrl);
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isSubscribed) {
      alert('Download only for premium subscribers');
      navigate('/pricing');
      return;
    }
    
    if (!file) return;
    
    try {
      const downloadUrl = `${WORKER_URL}/download/${file.cloudflareKey || file.id}`;
      const response = await fetch(downloadUrl, {
        headers: {
          'X-User-Id': user?.uid || '',
          'X-Is-Subscribed': isSubscribed ? 'true' : 'false'
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Onlibry.in_"${file.name || 'document'}.pdf"`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handlePurchase = () => {
    navigate('/pricing', { 
      state: { 
        from: `/viewer/${actualFileId}`, 
        fileId: actualFileId 
      } 
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    loadFile();
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button onClick={handleRetry} className="px-6 py-2 bg-green-600 text-white rounded-lg mr-3">
          🔄 Retry
        </button>
        <button onClick={handleGoBack} className="px-6 py-2 bg-gray-500 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  if (!canView && file?.isPremium && !isSubscribed) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Premium Content</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">This file is only available for premium subscribers.</p>
        {file && file.price && <p className="text-sm text-green-600 mb-4">₹{file.price}</p>}
        <button onClick={handlePurchase} className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold">
          Upgrade to Premium
        </button>
        <button onClick={handleGoBack} className="ml-3 px-6 py-3 bg-gray-500 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  if (pdfUrl) {
    const showDownloadButton = isSubscribed === true;
    
    return (
      <div className="fixed inset-0 bg-black z-50">
        <SecurePDFViewer
          key={pdfUrl}
          fileUrl={pdfUrl}
          fileName={file?.name}
          showDownloadButton={showDownloadButton}
          onDownload={handleDownload}
          isPremium={file?.isPremium}
          onClose={() => navigate(-1)}
        />
      </div>
    );
  }

  return (
    <div className="text-center py-20">
      <button onClick={handleGoBack} className="px-6 py-2 bg-green-600 text-white rounded-lg">Go Back</button>
    </div>
  );
}

export default FileViewer;