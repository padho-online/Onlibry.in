// src/pages/SavedFilesPage.jsx - Complete with responsive grid
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { unsaveFile } from '../services/fileService';
import { getAllFilesFromSheet } from '../services/cloudflareFileService';
import { getAllPapers as getAllMockTests } from '../services/mockTestService';
import { getAllPapers as getAllQuizzes } from '../services/quizService';
import { Bookmark, FileText, FileQuestion, HelpCircle, Trash2, Eye, ShoppingBag } from 'lucide-react';

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

  useEffect(() => {
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    loadSavedFiles();
    loadPurchasedItems();
  }, [user]);

  const loadSavedFiles = async () => {
    setLoadingSaved(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const savedFileIds = userDoc.data()?.savedFiles || [];
      if (savedFileIds.length === 0) { 
        setSavedFiles([]); 
        return; 
      }
      
      const allFiles = await getAllFilesFromSheet();
      const files = savedFileIds.map(id => allFiles.find(f => f.id === id || f.cloudflareKey === id)).filter(Boolean);
      setSavedFiles(files);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoadingSaved(false); 
    }
  };

const loadPurchasedItems = async () => {
  setLoadingPurchased(true);
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    // 🔥 FIX: Get purchased files from Firestore
    const purchasedFileIds = userData?.purchasedFiles || [];
    console.log('📊 Purchased file IDs from Firestore:', purchasedFileIds);
    
    // Also check localStorage backup
    const localStoragePurchased = JSON.parse(localStorage.getItem('onlibry_purchased') || '[]');
    console.log('📊 Purchased from localStorage:', localStoragePurchased);
    
    // Merge both sources
    const allPurchasedIds = [...new Set([...purchasedFileIds, ...localStoragePurchased])];
    console.log('📊 All purchased IDs (merged):', allPurchasedIds);
    
    const mockData = userData?.purchasedMockTests || [];
    const quizData = userData?.purchasedQuizzes || [];
    const hasSubscription = isSubscribed;

    // Load purchased files
    if (allPurchasedIds.length > 0) {
      const allFiles = await getAllFilesFromSheet();
      const files = allPurchasedIds.map(id => allFiles.find(f => f.id === id || f.cloudflareKey === id)).filter(Boolean);
      console.log('📊 Purchased files found:', files.length);
      setPurchasedFiles(files);
      files.forEach(f => setPurchasedAccessStatus(prev => ({ ...prev, [f.id]: true })));
    }
    
    if (mockData === 'all' || hasSubscription) {
      const allTests = await getAllMockTests();
      setPurchasedMockTests(allTests);
    } else if (mockData.length) {
      const allTests = await getAllMockTests();
      setPurchasedMockTests(allTests.filter(t => mockData.includes(t.id)));
    }
    
    if (quizData === 'all' || hasSubscription) {
      const allQuizzes = await getAllQuizzes();
      setPurchasedQuizzes(allQuizzes);
    } else if (quizData.length) {
      const allQuizzes = await getAllQuizzes();
      setPurchasedQuizzes(allQuizzes.filter(q => quizData.includes(q.id)));
    }
  } catch (error) { 
    console.error('Error loading purchased items:', error); 
  } finally { 
    setLoadingPurchased(false); 
  }
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

  const handleUnsave = async (fileId) => {
    await unsaveFile(fileId);
    setSavedFiles(prev => prev.filter(f => f.id !== fileId));
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
                onClick={(e) => { e.stopPropagation(); handleUnsave(item.id); }} 
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
      {/* Header */}
      <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">My Library</h1>
      
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