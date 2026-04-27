import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { unsaveFile, canAccessFile } from '../services/fileService';
import { checkViewLimit } from '../utils/helpers';

function SavedFilesPage() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [savedFiles, setSavedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/saved-files' } } });
      return;
    }
    loadSavedFiles();
  }, [user]);

  const loadSavedFiles = async () => {
    setLoading(true);
    try {
      // Get user's saved file IDs
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const savedFileIds = userDoc.data()?.savedFiles || [];
      
      if (savedFileIds.length === 0) {
        setSavedFiles([]);
        setLoading(false);
        return;
      }
      
      // Fetch each file's details
      const files = [];
      for (const fileId of savedFileIds) {
        const fileRef = doc(db, 'files', fileId);
        const fileDoc = await getDoc(fileRef);
        
        if (fileDoc.exists()) {
          const fileData = { id: fileDoc.id, ...fileDoc.data() };
          // Only show files that are visible on website
          if (fileData.showOnWebsite !== false) {
            files.push(fileData);
            
            // Check access status for each file
            const hasAccess = await canAccessFile(fileId);
            setAccessStatus(prev => ({ ...prev, [fileId]: hasAccess }));
          }
        }
      }
      
      setSavedFiles(files);
    } catch (error) {
      console.error('Error loading saved files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (file) => {
    if (!user) {
      if (!checkViewLimit()) {
        navigate('/login', { state: { from: { pathname: '/saved-files' } } });
        return;
      }
    }
    
    const hasAccess = accessStatus[file.id];
    if (!hasAccess && !isSubscribed) {
      navigate('/pricing', { state: { from: '/saved-files', fileId: file.id } });
      return;
    }
    
    // Open file viewer
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    } else {
      navigate(`/viewer/${file.id}`);
    }
  };

  const handleUnsave = async (fileId) => {
    const result = await unsaveFile(fileId);
    if (result.success) {
      // Remove from local state
      setSavedFiles(prev => prev.filter(f => f.id !== fileId));
    } else {
      alert('Failed to unsave file. Please try again.');
    }
  };

  const handleShare = async (file) => {
    const shareUrl = file.webViewLink || `https://onlibry.in/viewer.html?fileId=${file.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('📋 Link copied!');
    } catch (err) {
      alert('❌ Copy failed. Try again.');
    }
  };

  const renderTags = (tags) => {
    if (!tags) return null;
    const allTags = [];
    Object.entries(tags).forEach(([category, values]) => {
      if (values && values.length > 0) {
        allTags.push(...values);
      }
    });
    
    return allTags.slice(0, 3).map((tag, idx) => (
      <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
        {tag}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Your Saved Files
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bookmarks you've saved for quick access
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-2xl font-bold text-green-600">{savedFiles.length}</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">Saved Files</span>
          </div>
          <button
            onClick={loadSavedFiles}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {savedFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedFiles.map((file) => {
            const hasAccess = accessStatus[file.id];
            
            return (
              <div
                key={file.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4">
                  {/* File Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 flex-1">
                      {file.name}
                    </h3>
                    
                    {/* Premium Badge */}
                    {file.isPremium && !isSubscribed && !hasAccess && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {renderTags(file.tags)}
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
                      onClick={() => handleViewFile(file)}
                      className={`flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium transition ${
                        hasAccess || isSubscribed || !file.isPremium
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-yellow-500 hover:bg-yellow-600'
                      }`}
                    >
                      {hasAccess || isSubscribed || !file.isPremium ? '📖 View' : '🔒 Unlock'}
                    </button>
                    
                    <button
                      onClick={() => handleUnsave(file.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                      title="Remove from saved"
                    >
                      ❌
                    </button>
                    
                    <button
                      onClick={() => handleShare(file)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
                      title="Share"
                    >
                      🔗
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No Saved Files Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start exploring and save files you want to access later
          </p>
          <button
            onClick={() => navigate('/files')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Browse Files
          </button>
        </div>
      )}
    </div>
  );
}

export default SavedFilesPage;