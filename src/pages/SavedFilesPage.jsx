// src/pages/SavedFilesPage.jsx - Complete with responsive grid
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAllFilesFromSheet } from '../services/cloudflareFileService';
import { getAllPapers as getAllMockTests } from '../services/mockTestService';
import { getAllPapers as getAllQuizzes } from '../services/quizService';
import { Bookmark, FileText, FileQuestion, HelpCircle, Trash2, Eye, ShoppingBag, RefreshCw } from 'lucide-react';

function SavedFilesPage() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('saved');
  const [savedFiles, setSavedFiles] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [purchasedFiles, setPurchasedFiles] = useState([]);
  const [purchasedMockTests, setPurchasedMockTests] = useState([]);
  const [purchasedQuizzes, setPurchasedQuizzes] = useState([]);
  const [loadingPurchased, setLoadingPurchased] = useState(true);
  const [purchasedAccessStatus, setPurchasedAccessStatus] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    await Promise.all([
      loadSavedFiles(),
      loadPurchasedItems()
    ]);
  };

  const loadSavedFiles = async () => {
    setLoadingSaved(true);
    try {
      // 🔥 Get saved files from D1
      const { getUserSavedFromD1 } = await import('../services/d1Service');
      const result = await getUserSavedFromD1(user.uid);
      
      console.log('📊 Saved files from D1:', result);
      
      if (result.success && result.saved) {
        const files = result.saved.map(item => ({
          id: item.file_id,
          name: item.file_name || 'Unknown',
          price: item.price,
          isPremium: item.is_premium === 1,
          cloudflareKey: item.cloudflare_key,
          type: 'file'
        }));
        setSavedFiles(files);
      } else {
        setSavedFiles([]);
      }
    } catch (error) { 
      console.error('Error loading saved files:', error);
      setSavedFiles([]);
    } finally { 
      setLoadingSaved(false); 
    }
  };

  const loadPurchasedItems = async () => {
    setLoadingPurchased(true);
    try {
      // 🔥 PRIMARY: Get purchases from D1 database
      const { getUserPurchasesFromD1 } = await import('../services/d1Service');
      const d1Result = await getUserPurchasesFromD1(user.uid);
      
      console.log('📊 D1 Purchases Full Result:', d1Result);
      
      // Get purchases from D1
      const d1Purchases = d1Result.success ? d1Result.purchases : [];
      console.log('📊 D1 Purchases array:', d1Purchases);
      
      // Separate by type
      const purchasedFileIds = d1Purchases
        .filter(p => p.item_type === 'file')
        .map(p => p.file_id);
      
      const purchasedMockIds = d1Purchases
        .filter(p => p.item_type === 'mocktest')
        .map(p => p.file_id);
      
      const purchasedQuizIds = d1Purchases
        .filter(p => p.item_type === 'quiz')
        .map(p => p.file_id);
      
      console.log('📊 Purchased file IDs from D1:', purchasedFileIds);
      console.log('📊 Purchased mock IDs from D1:', purchasedMockIds);
      console.log('📊 Purchased quiz IDs from D1:', purchasedQuizIds);
      
      // 🔥 SECONDARY: Also get from Firestore as backup
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const firestorePurchasedIds = userData?.purchasedFiles || [];
      const firestoreMockIds = userData?.purchasedMockTests || [];
      const firestoreQuizIds = userData?.purchasedQuizzes || [];
      
      console.log('📊 Firestore purchased IDs:', firestorePurchasedIds);
      console.log('📊 Firestore mock IDs:', firestoreMockIds);
      console.log('📊 Firestore quiz IDs:', firestoreQuizIds);
      
      // Merge both sources (D1 primary, Firestore backup)
      const allPurchasedFileIds = [...new Set([...purchasedFileIds, ...firestorePurchasedIds])];
      const allPurchasedMockIds = [...new Set([...purchasedMockIds, ...firestoreMockIds])];
      const allPurchasedQuizIds = [...new Set([...purchasedQuizIds, ...firestoreQuizIds])];
      
      console.log('📊 All purchased file IDs (merged):', allPurchasedFileIds);
      console.log('📊 All purchased mock IDs (merged):', allPurchasedMockIds);
      console.log('📊 All purchased quiz IDs (merged):', allPurchasedQuizIds);
      
      const hasSubscription = isSubscribed;
      
      // ============================================
      // 🔥 FIXED: Load purchased files from D1 files table
      // ============================================
      if (allPurchasedFileIds.length > 0) {
        const { getFilesFromD1 } = await import('../services/d1Service');
        
        // 🔥 FIX: Use forceRefresh = true to get latest files
        const result = await getFilesFromD1(1, 1000, '', true);
        console.log('📊 All files from D1 (forceRefresh):', result.files?.length);
        
        if (result.success && result.files) {
          const files = result.files
            .filter(f => allPurchasedFileIds.includes(f.id))
            .map(f => ({
              id: f.id,
              name: f.name,
              type: 'file',
              cloudflareKey: f.cloudflare_key,
              price: f.price
            }));
          
          console.log('📊 Purchased files found after filtering:', files.length);
          console.log('📊 Purchased files details:', files.map(f => ({ id: f.id, name: f.name })));
          setPurchasedFiles(files);
          files.forEach(f => setPurchasedAccessStatus(prev => ({ ...prev, [f.id]: true })));
        } else {
          console.log('📊 No files found in D1 or API failed');
          setPurchasedFiles([]);
        }
      } else {
        console.log('📊 No purchased file IDs found');
        setPurchasedFiles([]);
      }
      
      // ============================================
      // Load purchased mock tests
      // ============================================
      if (allPurchasedMockIds.length > 0 || hasSubscription) {
        const allTests = await getAllMockTests();
        let purchasedTests = [];
        
        if (hasSubscription) {
          purchasedTests = allTests;
          console.log('📊 User has subscription, all mock tests accessible');
        } else if (allPurchasedMockIds.length > 0) {
          purchasedTests = allTests.filter(t => allPurchasedMockIds.includes(t.id));
        }
        
        console.log('📊 Purchased mock tests:', purchasedTests.length);
        setPurchasedMockTests(purchasedTests);
      } else {
        setPurchasedMockTests([]);
      }
      
      // ============================================
      // Load purchased quizzes
      // ============================================
      if (allPurchasedQuizIds.length > 0 || hasSubscription) {
        const allQuizzes = await getAllQuizzes();
        let purchasedQuizzesList = [];
        
        if (hasSubscription) {
          purchasedQuizzesList = allQuizzes;
          console.log('📊 User has subscription, all quizzes accessible');
        } else if (allPurchasedQuizIds.length > 0) {
          purchasedQuizzesList = allQuizzes.filter(q => allPurchasedQuizIds.includes(q.id));
        }
        
        console.log('📊 Purchased quizzes:', purchasedQuizzesList.length);
        setPurchasedQuizzes(purchasedQuizzesList);
      } else {
        setPurchasedQuizzes([]);
      }
      
    } catch (error) { 
      console.error('Error loading purchased items:', error);
      setPurchasedFiles([]);
      setPurchasedMockTests([]);
      setPurchasedQuizzes([]);
    } finally { 
      setLoadingPurchased(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleView = (item) => {
    if (item.type === 'mocktest') {
      navigate(`/mock-test/${encodeURIComponent(item.originalName)}`);
    } else if (item.type === 'quiz') {
      navigate(`/quiz/${encodeURIComponent(item.originalName)}`);
    } else {
      navigate(`/viewer/${item.id}`);
    }
  };

  const handleUnsave = async (fileId, fileName) => {
    try {
      const { removeSavedFileFromD1 } = await import('../services/d1Service');
      const result = await removeSavedFileFromD1(user.uid, fileId, fileName);
      console.log('Unsave result:', result);
      
      if (result.success) {
        setSavedFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        console.error('Unsave failed:', result.error);
      }
    } catch (error) {
      console.error('Error unsaving file:', error);
    }
  };

  const renderCard = (item, showUnsave = false, isPurch = false) => {
    const isPurchased = isPurch || purchasedAccessStatus[item.id];
    const icon = item.type === 'mocktest' ? <FileQuestion size={16} /> : item.type === 'quiz' ? <HelpCircle size={16} /> : <FileText size={16} />;
    
    return (
      <div 
        key={item.id} 
        onClick={() => handleView(item)} 
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-200 cursor-pointer overflow-hidden"
      >
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="shrink-0">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1">
                {item.name || item.displayName}
              </h3>
            </div>
            {item.type === 'mocktest' && (
              <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full shrink-0 ml-1">Test</span>
            )}
            {item.type === 'quiz' && (
              <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full shrink-0 ml-1">Quiz</span>
            )}
          </div>
          
          {item.type === 'mocktest' && item.duration && (
            <div className="flex gap-2 mb-2 text-[9px] text-gray-400">
              <span>⏱️ {item.duration} min</span>
              <span className="text-green-600">+{item.positiveMark}</span>
              <span className="text-red-600">-{item.negativeMark}</span>
            </div>
          )}
          
          <div className="flex gap-2 mt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleView(item); }} 
              className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition"
            >
              <Eye size={12} />
              <span className="hidden sm:inline">View</span>
            </button>
            {showUnsave && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleUnsave(item.id, item.name); }} 
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition"
                title="Remove from saved"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalPurchased = purchasedFiles.length + purchasedMockTests.length + purchasedQuizzes.length;

  return (
    <div className="py-3 md:py-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">My Library</h1>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex gap-4 md:gap-6 mb-4 md:mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('saved')} 
          className={`pb-2 text-sm md:text-base font-medium flex items-center gap-1 md:gap-2 transition ${
            activeTab === 'saved' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bookmark size={16} />
          <span>Saved ({savedFiles.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('purchased')} 
          className={`pb-2 text-sm md:text-base font-medium flex items-center gap-1 md:gap-2 transition ${
            activeTab === 'purchased' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag size={16} />
          <span>Purchased ({totalPurchased})</span>
        </button>
      </div>

      {/* Saved Files Tab */}
      {activeTab === 'saved' && (
        <>
          {loadingSaved ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : savedFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {savedFiles.map(f => renderCard({ ...f, type: 'file' }, true, false))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 bg-gray-50 rounded-xl">
              <Bookmark size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm mb-3">No saved files yet</p>
              <button onClick={() => navigate('/files')} className="text-green-600 text-sm font-medium hover:underline">
                Browse Files →
              </button>
            </div>
          )}
        </>
      )}

      {/* Purchased Items Tab */}
      {activeTab === 'purchased' && (
        <>
          {loadingPurchased ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : totalPurchased > 0 ? (
            <div className="space-y-6 md:space-y-8">
              
              {/* Purchased Files */}
              {purchasedFiles.length > 0 && (
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-green-600" />
                    Files ({purchasedFiles.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {purchasedFiles.map(f => renderCard({ ...f, type: 'file' }, false, true))}
                  </div>
                </div>
              )}

              {/* Purchased Mock Tests */}
              {purchasedMockTests.length > 0 && (
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileQuestion size={16} className="text-blue-600" />
                    Mock Tests ({purchasedMockTests.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {purchasedMockTests.map(t => renderCard({ ...t, type: 'mocktest' }, false, true))}
                  </div>
                </div>
              )}

              {/* Purchased Quizzes */}
              {purchasedQuizzes.length > 0 && (
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <HelpCircle size={16} className="text-purple-600" />
                    Quizzes ({purchasedQuizzes.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {purchasedQuizzes.map(q => renderCard({ ...q, type: 'quiz' }, false, true))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 bg-gray-50 rounded-xl">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm mb-3">No purchases yet</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/files')} className="text-green-600 text-sm font-medium hover:underline">
                  Browse Files →
                </button>
                <button onClick={() => navigate('/mock-tests')} className="text-blue-600 text-sm font-medium hover:underline">
                  Mock Tests →
                </button>
                <button onClick={() => navigate('/quizzes')} className="text-purple-600 text-sm font-medium hover:underline">
                  Quizzes →
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