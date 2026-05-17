// src/components/FileViewer.jsx
// UPDATED - Handles preview mode from URL params

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFileById } from '../services/fileService';
import PdfViewer from '../viewer/PdfViewer';
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
  
  // 🔥 Get preview mode from URL param
  const isPreviewMode = searchParams.get('preview') === 'true';
  const previewFileName = searchParams.get('fileName') || '';
  const previewPrice = searchParams.get('price') || 29;

  const actualFileId = fileId || searchParams.get('fileId');

// 🔥 CHECK PURCHASED FROM D1 (Primary) + Firestore (Backup)
const checkPurchasedFile = async (userId, fileIdentifier) => {
  if (!userId) return false;
  
  try {
    // First check D1
    const { checkPurchasedInD1 } = await import('../services/d1Service');
    const d1Result = await checkPurchasedInD1(userId, fileIdentifier);
    
    console.log(`🔍 D1 Purchase check for ${fileIdentifier}:`, d1Result);
    
    if (d1Result.success && d1Result.purchased) {
      console.log('✅ File found in D1 purchases');
      return true;
    }
    
    // Fallback to Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    // Check in all purchase arrays
    const purchasedFiles = userData?.purchasedFiles || [];
    const purchasedMockTests = userData?.purchasedMockTests || [];
    const purchasedQuizzes = userData?.purchasedQuizzes || [];
    
    const isPurchased = purchasedFiles.includes(fileIdentifier) ||
                        purchasedMockTests.includes(fileIdentifier) ||
                        purchasedQuizzes.includes(fileIdentifier) ||
                        purchasedMockTests === 'all' ||
                        purchasedQuizzes === 'all';
    
    if (isPurchased) {
      console.log('✅ File found in Firestore purchases');
    }
    
    return isPurchased;
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
      
      // 🔥 PREVIEW MODE: Always accessible (but limited pages)
      if (isPreviewMode) {
        hasAccess = true;
        setCanView(true);
        setCheckingAccess(false);
        
        const workerFileId = fileData.cloudflareKey || fileData.id;
        const viewUrl = `${WORKER_URL}/view/${workerFileId}`;
        setPdfUrl(viewUrl);
        setLoading(false);
        return;
      }
      
     // 🔥 FULL ACCESS MODE: Check permissions
// Case 1: Free file
if (!fileData.isPremium) {
  hasAccess = true;
}
// Case 2: Premium user (subscribed)
else if (isSubscribed) {
  hasAccess = true;
}
// Case 3: Check if user purchased this item (file, mocktest, or quiz)
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

  // 🔥 Handle download (only for premium users, not for preview mode)
  const handleDownload = () => {
    if (!isSubscribed) {
      alert('📥 Download only for premium subscribers');
      navigate('/pricing', { state: { activeTab: 'subscription' } });
      return;
    }
    
    if (!file) return;
    
    const fileKey = file.cloudflareKey || file.id;
    const downloadUrl = `${WORKER_URL}/download/${encodeURIComponent(fileKey)}?subscribed=true`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Onlibry.in_${file.name || 'document'}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔥 Handle subscribe from masked page (add to cart and open cart)
  const handleSubscribeFromMasked = () => {
    if (!user) {
      navigate('/login', { state: { from: `/viewer/${actualFileId}` } });
      return;
    }
    
    // Add to cart
    const { addToCart } = require('../contexts/CartContext').useCart();
    addToCart({
      id: actualFileId,
      name: file?.name || previewFileName,
      price: file?.price || parseInt(previewPrice) || 29,
      type: 'file',
      originalName: file?.name || previewFileName,
      cloudflareKey: file?.cloudflareKey || actualFileId
    });
    
    // Redirect to cart tab
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

  // 🔥 Preview Mode Access Denied (user not logged in)
  if (isPreviewMode && !user) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Login Required</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please login to view sample preview.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/login', { state: { from: `/viewer/${actualFileId}?preview=true` } })}
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

  // 🔥 Full Access Denied (not subscribed, not purchased)
  if (!canView && !isPreviewMode && file?.isPremium && !isSubscribed && !isPurchased) {
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
            onClick={() => {
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
            }}
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
    // 🔥 Determine if download button should be shown (only for premium subscribers, NOT in preview mode)
    const showDownloadButton = isSubscribed === true && !isPreviewMode;
    
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Close button */}
        <div className="bg-gray-900 text-white p-2 flex justify-end">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
          >
            ✕ Close
          </button>
        </div>
        
        {/* PDF Viewer */}
        <div className="flex-1">
          <PdfViewer
            key={pdfUrl}
            pdfUrl={pdfUrl}
            fileName={file?.name || previewFileName}
            isSubscribed={isSubscribed}
            isPreviewMode={isPreviewMode}
            previewLimit={3}
            userEmail={user?.email}
            onDownload={handleDownload}
            onPageChange={(page) => console.log('Page changed:', page)}
            onSubscribe={handleSubscribeFromMasked}
          />
        </div>
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