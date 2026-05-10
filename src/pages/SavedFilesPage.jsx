// src/pages/SavedFilesPage.jsx
// UPDATED - Added Purchased Items Section (Files, Mock Tests, Quizzes)
// FIXED - Handle 'all' flag for subscription users

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { unsaveFile, canAccessFile } from '../services/fileService';
import { getAllFilesFromSheet } from '../services/cloudflareFileService';
import { getAllPapers as getAllMockTests } from '../services/mockTestService';
import { getAllPapers as getAllQuizzes } from '../services/quizService';
import { checkViewLimit } from '../utils/helpers';

function SavedFilesPage() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('saved'); // 'saved', 'purchased'
  
  // Saved files state
  const [savedFiles, setSavedFiles] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [accessStatus, setAccessStatus] = useState({});
  
  // Purchased items state
  const [purchasedFiles, setPurchasedFiles] = useState([]);
  const [purchasedMockTests, setPurchasedMockTests] = useState([]);
  const [purchasedQuizzes, setPurchasedQuizzes] = useState([]);
  const [loadingPurchased, setLoadingPurchased] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/saved-files' } } });
      return;
    }
    loadSavedFiles();
    loadPurchasedItems();
  }, [user]);

  // ============================================
  // LOAD SAVED FILES
  // ============================================
  const loadSavedFiles = async () => {
    setLoadingSaved(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const savedFileIds = userDoc.data()?.savedFiles || [];
      
      if (savedFileIds.length === 0) {
        setSavedFiles([]);
        setLoadingSaved(false);
        return;
      }
      
      const allFiles = await getAllFilesFromSheet();
      const files = [];
      
      for (const fileId of savedFileIds) {
        const fileData = allFiles.find(f => 
          f.id === fileId || f.cloudflareKey === fileId || f.originalId === fileId
        );
        
        if (fileData && fileData.showOnWebsite !== false) {
          files.push({
            id: fileData.cloudflareKey || fileData.id,
            ...fileData
          });
          
          const hasAccess = await canAccessFile(fileId);
          setAccessStatus(prev => ({ ...prev, [fileId]: hasAccess }));
        }
      }
      
      setSavedFiles(files);
    } catch (error) {
      console.error('Error loading saved files:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  // ============================================
  // LOAD PURCHASED ITEMS
  // 🔥 UPDATED: Handle 'all' flag for subscription users
  // ============================================
  const loadPurchasedItems = async () => {
    setLoadingPurchased(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const purchasedFileIds = userDoc.data()?.purchasedFiles || [];
      let purchasedMockTestData = userDoc.data()?.purchasedMockTests || [];
      let purchasedQuizData = userDoc.data()?.purchasedQuizzes || [];
      
      // Load purchased files
      if (purchasedFileIds.length > 0) {
        const allFiles = await getAllFilesFromSheet();
        const files = purchasedFileIds.map(fileId => {
          const fileData = allFiles.find(f => 
            f.id === fileId || f.cloudflareKey === fileId || f.originalId === fileId
          );
          if (fileData) {
            return {
              id: fileData.cloudflareKey || fileData.id,
              ...fileData,
              type: 'file'
            };
          }
          return null;
        }).filter(f => f !== null);
        setPurchasedFiles(files);
      }
      
      // 🔥 NEW: Check if user has subscription ('all' flag)
      const hasSubscriptionAccess = isSubscribed === true;
      
      // Load purchased mock tests - Handle 'all' flag
      if (purchasedMockTestData === 'all' || hasSubscriptionAccess) {
        // User has subscription - show ALL mock tests
        console.log('📝 User has subscription - showing all mock tests');
        const allMockTests = await getAllMockTests();
        const mockTests = allMockTests.map(mt => ({
          ...mt,
          type: 'mocktest',
          name: mt.displayName,
          id: mt.id
        }));
        setPurchasedMockTests(mockTests);
      } else if (purchasedMockTestData.length > 0) {
        // User purchased specific mock tests
        const allMockTests = await getAllMockTests();
        const mockTests = allMockTests.filter(mt => 
          purchasedMockTestData.includes(mt.id) || purchasedMockTestData.includes(mt.originalName)
        ).map(mt => ({
          ...mt,
          type: 'mocktest',
          name: mt.displayName,
          id: mt.id
        }));
        setPurchasedMockTests(mockTests);
      }
      
      // Load purchased quizzes - Handle 'all' flag
      if (purchasedQuizData === 'all' || hasSubscriptionAccess) {
        // User has subscription - show ALL quizzes
        console.log('❓ User has subscription - showing all quizzes');
        const allQuizzes = await getAllQuizzes();
        const quizzes = allQuizzes.map(q => ({
          ...q,
          type: 'quiz',
          name: q.displayName,
          id: q.id
        }));
        setPurchasedQuizzes(quizzes);
      } else if (purchasedQuizData.length > 0) {
        // User purchased specific quizzes
        const allQuizzes = await getAllQuizzes();
        const quizzes = allQuizzes.filter(q => 
          purchasedQuizData.includes(q.id) || purchasedQuizData.includes(q.originalName)
        ).map(q => ({
          ...q,
          type: 'quiz',
          name: q.displayName,
          id: q.id
        }));
        setPurchasedQuizzes(quizzes);
      }
      
    } catch (error) {
      console.error('Error loading purchased items:', error);
    } finally {
      setLoadingPurchased(false);
    }
  };

  // ============================================
  // HANDLE UNSAVE
  // ============================================
  const handleUnsave = async (fileId) => {
    const result = await unsaveFile(fileId);
    if (result.success) {
      setSavedFiles(prev => prev.filter(f => f.id !== fileId));
    } else {
      alert('Failed to unsave file. Please try again.');
    }
  };

  // ============================================
  // HANDLE VIEW FILE
  // ============================================
  const handleViewFile = (item) => {
    if (!user) {
      if (!checkViewLimit()) {
        navigate('/login', { state: { from: { pathname: '/saved-files' } } });
        return;
      }
    }
    
    if (item.type === 'mocktest') {
      navigate(`/mock-test/${encodeURIComponent(item.originalName)}`);
    } else if (item.type === 'quiz') {
      navigate(`/quiz/${encodeURIComponent(item.originalName)}`);
    } else {
      const hasAccess = accessStatus[item.id] || isSubscribed;
      if (!hasAccess && item.isPremium) {
        navigate('/pricing', { state: { from: '/saved-files', fileId: item.id } });
        return;
      }
      navigate(`/viewer/${item.id}`);
    }
  };

  // ============================================
  // RENDER TAGS
  // ============================================
  const renderTags = (item) => {
    let tags = item.tagsList || [];
    if (tags.length === 0 && item.tags && typeof item.tags === 'object') {
      Object.values(item.tags).forEach(values => {
        if (Array.isArray(values)) tags.push(...values);
        else if (typeof values === 'string') tags.push(values);
      });
    }
    
    return tags.slice(0, 3).map((tag, idx) => (
      <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
        {tag.length > 25 ? tag.substring(0, 22) + '...' : tag}
      </span>
    ));
  };

  // ============================================
  // RENDER ITEM CARD
  // ============================================
  const renderItemCard = (item, showUnsave = false, onUnsave = null) => {
    const isPremiumItem = item.isPremium === true;
    const hasAccess = accessStatus[item.id] || isSubscribed;
    
    return (
      <div
        key={item.id}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => handleViewFile(item)}
      >
        <div className="p-4">
          {/* Header with type badge */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {item.type === 'mocktest' ? '📝' : item.type === 'quiz' ? '❓' : '📄'}
              </span>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-1">
                {item.name}
              </h3>
            </div>
            <div className="flex gap-1">
              {isPremiumItem && !hasAccess && (
                <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                  Premium
                </span>
              )}
              {item.type === 'mocktest' && (
                <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  Mock Test
                </span>
              )}
              {item.type === 'quiz' && (
                <span className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  Quiz
                </span>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {renderTags(item)}
          </div>
          
          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}
          
          {/* Mock Test Details */}
          {item.type === 'mocktest' && item.duration && (
            <div className="flex gap-3 mb-3 text-xs text-gray-500">
              <span>⏱️ {item.duration} min</span>
              <span className="text-green-600">✅ +{item.positiveMark}</span>
              <span className="text-red-600">❌ -{item.negativeMark}</span>
            </div>
          )}
          
          {/* Quiz Details */}
          {item.type === 'quiz' && item.duration && (
            <div className="flex gap-3 mb-3 text-xs text-gray-500">
              <span>⏱️ {item.duration} min</span>
              <span className="text-green-600">✅ +{item.positiveMark}</span>
              <span className="text-red-600">❌ -{item.negativeMark}</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleViewFile(item); }}
              className={`flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium transition ${
                hasAccess || !isPremiumItem
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              {hasAccess || !isPremiumItem ? '📖 View' : '🔒 Unlock'}
            </button>
            
            {showUnsave && onUnsave && (
              <button
                onClick={(e) => { e.stopPropagation(); onUnsave(item.id); }}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                title="Remove from saved"
              >
                ❌
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  const totalPurchased = purchasedFiles.length + purchasedMockTests.length + purchasedQuizzes.length;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          My Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your saved files and purchased items
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'saved'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📌 Saved Files ({savedFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('purchased')}
          className={`px-6 py-3 font-medium transition ${
            activeTab === 'purchased'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🛒 Purchased ({totalPurchased})
        </button>
      </div>

      {/* ============================================ */}
      {/* SAVED FILES TAB */}
      {/* ============================================ */}
      {activeTab === 'saved' && (
        <>
          {loadingSaved ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : savedFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedFiles.map((file) => renderItemCard(file, true, handleUnsave))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                No Saved Files Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click the 📌 button on any file to save it for later
              </p>
              <button
                onClick={() => navigate('/files')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Browse Files
              </button>
            </div>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* PURCHASED ITEMS TAB */}
      {/* ============================================ */}
      {activeTab === 'purchased' && (
        <>
          {loadingPurchased ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : totalPurchased > 0 ? (
            <div className="space-y-8">
              
              {/* Purchased Files Section */}
              {purchasedFiles.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span>📄</span> Purchased Files ({purchasedFiles.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedFiles.map((file) => renderItemCard(file, false))}
                  </div>
                </div>
              )}

              {/* Purchased Mock Tests Section */}
              {purchasedMockTests.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span>📝</span> Purchased Mock Tests ({purchasedMockTests.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedMockTests.map((test) => renderItemCard(test, false))}
                  </div>
                </div>
              )}

              {/* Purchased Quizzes Section */}
              {purchasedQuizzes.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span>❓</span> Purchased Quizzes ({purchasedQuizzes.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedQuizzes.map((quiz) => renderItemCard(quiz, false))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                No Purchased Items Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Buy mock tests, quizzes, or files to see them here
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/files')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Browse Files
                </button>
                <button
                  onClick={() => navigate('/mock-tests')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Mock Tests
                </button>
                <button
                  onClick={() => navigate('/quizzes')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Quizzes
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SavedFilesPage;