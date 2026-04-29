import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveFile, unsaveFile, isFileSaved, canAccessFile } from '../services/fileService';
import { checkViewLimit } from '../utils/helpers';

function FileCard({ file }) {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
    
    // Paid user but no access (premium file without subscription)
    if (!canAccess && file.isPremium) {
      navigate('/pricing', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    
    // Free file OR paid user with access - open file
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    } else {
      navigate(`/viewer/${file.id}`);
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
    // Go to single file purchase page
    navigate(`/purchase/${file.id}`, { state: { file: file } });
  };

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

  // Render tags
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

  // Determine button text and action
  const getButtonConfig = () => {
    // Guest user
    if (!user) {
      return { text: 'View', action: handleViewFile, color: 'bg-green-600' };
    }
    
    // Logged in user - Premium file without access
    if (file.isPremium && !canAccess && !isSubscribed) {
      return { text: `🔒 Unlock (₹${file.price || 29})`, action: handleUnlockFile, color: 'bg-yellow-600' };
    }
    
    // Logged in user - Has access (free or subscribed)
    return { text: '📖 View', action: handleViewFile, color: 'bg-green-600' };
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
          <button
            onClick={buttonConfig.action}
            className={`flex-1 px-3 py-2 ${buttonConfig.color} hover:opacity-90 text-white text-sm font-medium rounded-lg transition`}
          >
            {buttonConfig.text}
          </button>
          
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