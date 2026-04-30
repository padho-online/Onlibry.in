import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveFile, unsaveFile, isFileSaved, canAccessFile } from '../services/fileService';
import { requestSecureDownload, triggerDownload } from '../services/downloadService';
import { checkViewLimit } from '../utils/helpers';

function FileCard({ file }) {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        const saved = await isFileSaved(file.id);
        setIsSaved(saved);
        const access = await canAccessFile(file.id);
        setCanAccess(access);
      } else {
        // Guest user: only free files are accessible
        setCanAccess(!file.isPremium);
      }
    };
    checkStatus();
  }, [file.id, user, file.isPremium]);

  // ============================================
  // VIEW FILE HANDLER - Guest users ko login page
  // ============================================
  const handleViewFile = () => {
    // Guest user - redirect to login
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    
    // Logged in user - Premium file without subscription
    if (file.isPremium && !canAccess && !isSubscribed) {
      navigate('/pricing', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    
    // Free file OR subscribed user - open file viewer
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    } else {
      navigate(`/viewer/${file.id}`);
    }
  };

  // ============================================
  // DOWNLOAD FILE HANDLER - Secure download
  // ============================================
  const handleDownload = async () => {
    // Guest user not allowed to download
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }

    // Free user trying to download premium file - redirect to subscribe
    if (file.isPremium && !isSubscribed && !canAccess) {
      navigate('/pricing', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }

    setDownloading(true);
    
    try {
      const result = await requestSecureDownload(file.id);
      
      if (result.success && result.downloadUrl) {
        triggerDownload(result.downloadUrl, file.name);
      } else {
        alert(result.message || 'Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(error.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ============================================
  // UNLOCK FILE HANDLER - Single file purchase
  // ============================================
  const handleUnlockFile = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    navigate(`/purchase/${file.id}`, { state: { file: file } });
  };

  // ============================================
  // SAVE/UNSAVE HANDLER
  // ============================================
  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files' } } });
      return;
    }
    
    setLoading(true);
    if (isSaved) {
      await unsaveFile(file.id);
      setIsSaved(false);
    } else {
      await saveFile(file.id);
      setIsSaved(true);
    }
    setLoading(false);
  };

  // ============================================
  // SHARE HANDLER
  // ============================================
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = file.webViewLink || `https://onlibry.in/viewer.html?fileId=${file.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('📋 Link copied!');
    } catch (err) {
      alert('❌ Copy failed. Try again.');
    }
  };

  // ============================================
  // RENDER TAGS
  // ============================================
  const renderTags = () => {
    const tags = [];
    if (file.tags) {
      Object.entries(file.tags).forEach(([category, values]) => {
        if (values && values.length > 0) {
          tags.push(...values.slice(0, 2));
        }
      });
    }
    
    return tags.slice(0, 3).map((tag, idx) => (
      <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
        {tag}
      </span>
    ));
  };

  // ============================================
  // BUTTON CONFIGURATION BASED ON USER TYPE
  // ============================================
  // Requirement Table:
  // | User Type              | Free File | Premium File | Single Purchased File |
  // |------------------------|-----------|--------------|----------------------|
  // | Guest (Not Logged In)  | Login     | Login        | N/A                  |
  // | Free User (Logged In)  | View Only | Subscribe    | Download             |
  // | Premium User           | Download  | Download     | Download             |
  // ============================================
  
  const getButtonConfig = () => {
    // ========== GUEST USER ==========
    if (!user) {
      return { 
        text: 'View', 
        action: handleViewFile, 
        color: 'bg-green-600',
        showDownload: false 
      };
    }
    
    // ========== FREE USER (Logged in but not subscribed) ==========
    if (!isSubscribed) {
      // Free user + Free file → View Only (No download)
      if (!file.isPremium) {
        return { 
          text: '📖 View', 
          action: handleViewFile, 
          color: 'bg-green-600',
          showDownload: false 
        };
      }
      
      // Free user + Premium file (not purchased) → Subscribe button
      if (!canAccess) {
        return { 
          text: `🔒 Subscribe (₹${file.price || 29})`, 
          action: handleUnlockFile, 
          color: 'bg-yellow-600',
          showDownload: false 
        };
      }
      
      // Free user + Premium file (single purchased) → Download available
      if (canAccess && file.isPremium) {
        return { 
          text: '📖 View', 
          action: handleViewFile, 
          color: 'bg-green-600',
          showDownload: true 
        };
      }
    }
    
    // ========== PREMIUM USER (Subscribed) ==========
    if (isSubscribed) {
      // Premium user any file → Download + View
      return { 
        text: '📖 View', 
        action: handleViewFile, 
        color: 'bg-green-600',
        showDownload: true 
      };
    }
    
    // Default fallback
    return { 
      text: '📖 View', 
      action: handleViewFile, 
      color: 'bg-green-600',
      showDownload: false 
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 flex-1">
            {file.name}
          </h3>
          
          {/* Premium Badge */}
          {file.isPremium && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
              Premium
            </span>
          )}
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {renderTags()}
        </div>
        
        {/* Description */}
        {file.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {file.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          {/* Main Button (View/Subscribe/Unlock) */}
          <button
            onClick={buttonConfig.action}
            className={`flex-1 px-3 py-2 ${buttonConfig.color} hover:opacity-90 text-white text-sm font-medium rounded-lg transition`}
          >
            {buttonConfig.text}
          </button>
          
          {/* Download Button - Only for users who can download */}
          {buttonConfig.showDownload && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              title="Download"
            >
              {downloading ? '⏳' : '⬇️'}
            </button>
          )}
          
          {/* Save Button */}
          <button
            onClick={handleSaveToggle}
            disabled={loading}
            className={`px-3 py-2 rounded-lg transition ${
              isSaved 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
            title={isSaved ? 'Saved' : 'Save for later'}
          >
            {isSaved ? '⭐' : '📌'}
          </button>
          
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
            title="Share"
          >
            🔗
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileCard;