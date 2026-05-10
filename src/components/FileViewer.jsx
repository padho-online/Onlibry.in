// src/components/FileViewer.jsx
// UPDATED - With purchased items access check
// DOWNLOAD BUTTON: ONLY for premium subscribers (NOT for single file purchase, NOT for free users)

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

  // Check if user has purchased this specific file
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
      
      // 🔥 CHECK ACCESS LOGIC:
      // 1. If file is free -> always accessible
      // 2. If user is premium subscriber -> accessible
      // 3. If user purchased this specific file -> accessible
      // 4. Else -> not accessible
      
      let hasAccess = false;
      
      // Case 1: Free file
      if (!fileData.isPremium) {
        hasAccess = true;
      }
      // Case 2: Premium user
      else if (isSubscribed) {
        hasAccess = true;
      }
      // Case 3: Check if user purchased this file
      else if (user) {
        const purchased = await checkPurchasedFile(user.uid, actualFileId);
        setIsPurchased(purchased);
        hasAccess = purchased;
      }
      
      setCanView(hasAccess);
      setCheckingAccess(false);
      
      if (hasAccess) {
        const workerFileId = fileData.cloudflareKey || fileData.id;
        const viewUrl = `${WORKER_URL}/view/${workerFileId}`;
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

  // 🔥 DOWNLOAD HANDLER - ONLY for premium subscribers
  const handleDownload = async () => {
    // Only premium subscribers can download
    if (!isSubscribed) {
      alert('📥 Download feature is only available for premium subscribers. Upgrade to download files.');
      navigate('/pricing', { state: { activeTab: 'subscription' } });
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
    // Add to cart first
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
    // User not logged in
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
            <button
              onClick={handleGoBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg"
            >
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
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (pdfUrl) {
    // 🔥 DOWNLOAD BUTTON: ONLY for premium subscribers (NOT for single file purchase)
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