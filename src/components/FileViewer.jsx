// src/components/FileViewer.jsx
// FINAL - Download with query param (secure, no URL exposure)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFileById } from '../services/fileService';
import SecurePDFViewer from './SecurePDFViewer';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;

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
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const actualFileId = fileId || searchParams.get('fileId');

  const checkPurchasedFile = async (userId, fileIdentifier) => {
    if (!userId) return false;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const purchasedFiles = userDoc.data()?.purchasedFiles || [];
      return purchasedFiles.includes(fileIdentifier);
    } catch (error) {
      console.error('Error checking purchased file:', error);
      return false;
    }
  };

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
    setCheckingAccess(true);
    
    try {
      const fileData = await getFileById(actualFileId);
      
      if (!fileData) {
        setError('File not found');
        setLoading(false);
        setCheckingAccess(false);
        return;
      }
      
      setFile(fileData);
      
      let hasAccess = false;
      
      if (!fileData.isPremium) {
        hasAccess = true;
      }
      else if (isSubscribed) {
        hasAccess = true;
      }
      else if (user) {
        const purchased = await checkPurchasedFile(user.uid, actualFileId);
        setIsPurchased(purchased);
        hasAccess = purchased;
      }
      
      setCanView(hasAccess);
      setCheckingAccess(false);
      
      if (hasAccess) {
        const workerFileId = fileData.cloudflareKey || fileData.id;
        const isPremiumParam = fileData.isPremium ? 'true' : 'false';
        const viewUrl = `${WORKER_URL}/view/${workerFileId}?isPremium=${isPremiumParam}`;
        setPdfUrl(viewUrl);
      }
      
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
      setCheckingAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FINAL: Download with query param (secure, no fetch)
  const handleDownload = () => {
    if (!isSubscribed) {
      alert('📥 Download only for premium subscribers');
      navigate('/pricing', { state: { activeTab: 'subscription' } });
      return;
    }
    
    if (!file) return;
    
    const fileKey = file.cloudflareKey || file.id;
    const downloadUrl = `${WORKER_URL}/download/${encodeURIComponent(fileKey)}?subscribed=true`;
    
    // Create hidden anchor and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Onlibry.in_${file.name || 'document'}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePurchase = () => {
    const { addToCart } = require('../contexts/CartContext').useCart();
    addToCart({
      id: actualFileId,
      name: file?.name,
      price: file?.price || 29,
      type: 'file',
      originalName: file?.name,
      cloudflareKey: file?.cloudflareKey
    });
    navigate('/pricing', { state: { activeTab: 'cart' } });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    loadFile();
  };

  if (loading || checkingAccess) {
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

  if (!canView && file?.isPremium && !isSubscribed && !isPurchased) {
    if (!user) {
      return (
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Login Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please login to access this file.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/login', { state: { from: `/viewer/${actualFileId}` } })}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
            >
              Login Now
            </button>
            <button onClick={handleGoBack} className="px-6 py-3 bg-gray-500 text-white rounded-lg">
              Go Back
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Premium Content</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This file is only available for premium subscribers or individual purchase.
        </p>
        {file && file.price && <p className="text-sm text-green-600 mb-4">₹{file.price}</p>}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={handlePurchase}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold"
          >
            Buy Now (₹{file?.price || 29})
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
          >
            Subscribe for Full Access
          </button>
          <button onClick={handleGoBack} className="px-6 py-3 bg-gray-500 text-white rounded-lg">
            Go Back
          </button>
        </div>
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