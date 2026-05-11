// src/pages/MockTestsPage.jsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPapers, getAllCategories, getSubCategoriesForCategory } from '../services/mockTestService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Search, ChevronDown, ShoppingCart, Trash2, Play, Lock } from 'lucide-react';

function MockTestsPage() {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [cartStatus, setCartStatus] = useState({});
  const [purchasedStatus, setPurchasedStatus] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const checkPurchasedMockTest = async (userId, testId) => {
    if (!userId) return false;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const purchased = userDoc.data()?.purchasedMockTests || [];
      return purchased === 'all' || (Array.isArray(purchased) && purchased.includes(testId));
    } catch (error) {
      return false;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const allPapers = await getAllPapers();
      const allCategories = await getAllCategories();
      setPapers(allPapers);
      setFilteredPapers(allPapers);
      setCategories(allCategories);
      
      const status = {};
      allPapers.forEach(p => status[p.id] = isInCart(p.id));
      setCartStatus(status);
      
      if (user && !isSubscribed) {
        const purchasedMap = {};
        for (const paper of allPapers) {
          if (!paper.isFree) purchasedMap[paper.id] = await checkPurchasedMockTest(user.uid, paper.id);
        }
        setPurchasedStatus(purchasedMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let filtered = [...papers];
    if (selectedCategory !== 'all') filtered = filtered.filter(p => p.category === selectedCategory);
    if (selectedSubCategory !== 'all') filtered = filtered.filter(p => p.subCategory === selectedSubCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.displayName.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => a.isFree === b.isFree ? 0 : a.isFree ? -1 : 1);
    setFilteredPapers(filtered);
  }, [selectedCategory, selectedSubCategory, searchQuery, papers]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      getSubCategoriesForCategory(selectedCategory).then(setSubCategories);
      setSelectedSubCategory('all');
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  const handleTestAction = (paper) => {
    const hasAccess = paper.isFree || isSubscribed || purchasedStatus[paper.id];
    if (hasAccess) navigate(`/mock-test/${encodeURIComponent(paper.originalName)}`);
    else if (!user) navigate('/login');
    else navigate('/pricing');
  };

  const handleAddToCart = (paper, e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    addToCart({ id: paper.id, name: paper.displayName, price: paper.price || 49, type: 'mocktest', originalName: paper.originalName });
    setCartStatus(prev => ({ ...prev, [paper.id]: true }));
  };

  const handleRemoveFromCart = (paperId, e) => {
    e.stopPropagation();
    removeFromCart(paperId);
    setCartStatus(prev => ({ ...prev, [paperId]: false }));
  };

  const handleSubscribe = (paper, e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    addToCart({ id: paper.id, name: paper.displayName, price: paper.price || 49, type: 'mocktest', originalName: paper.originalName });
    navigate('/pricing', { state: { activeTab: 'cart' } });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="py-3 md:py-6">
      <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1">Mock Tests</h1>
      <p className="text-xs md:text-sm text-gray-500 mb-4">Practice with real exam patterns</p>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex items-center gap-1">
          Filters <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1 rounded-full text-xs ${selectedCategory === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>All</button>
            {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-full text-xs ${selectedCategory === cat ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{cat}</button>)}
          </div>
          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <button onClick={() => setSelectedSubCategory('all')} className={`px-2 py-0.5 rounded-full text-[10px] ${selectedSubCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>All</button>
              {subCategories.map(sub => <button key={sub} onClick={() => setSelectedSubCategory(sub)} className={`px-2 py-0.5 rounded-full text-[10px] ${selectedSubCategory === sub ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{sub}</button>)}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mb-3">{filteredPapers.length} tests</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
        {filteredPapers.map(paper => {
          const isPurchased = purchasedStatus[paper.id];
          const inCart = cartStatus[paper.id];
          const isFree = paper.isFree;
          const hasAccess = isFree || isSubscribed || isPurchased;
          
          return (
            <div key={paper.id} onClick={() => handleTestAction(paper)} className="bg-white rounded-xl shadow-md p-3 border border-gray-200 cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1">{paper.displayName}</h3>
                {!isFree && !hasAccess && <span className="text-[10px] font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">₹{paper.price || 49}</span>}
                {isFree && <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Free</span>}
                {hasAccess && !isFree && <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Unlocked</span>}
              </div>
              <div className="flex gap-2 mb-2 text-[10px] text-gray-500">
                <span>⏱️ {paper.duration} min</span>
                <span className="text-green-600">+{paper.positiveMark}</span>
                <span className="text-red-600">-{paper.negativeMark}</span>
              </div>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                {hasAccess ? (
                  <button onClick={() => handleTestAction(paper)} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"><Play size={12} /><span className="hidden sm:inline">Start</span></button>
                ) : (
                  <>
                    <button onClick={(e) => handleSubscribe(paper, e)} className="flex-1 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"><Lock size={12} /><span className="hidden sm:inline">Subscribe</span></button>
                    <button onClick={inCart ? (e) => handleRemoveFromCart(paper.id, e) : (e) => handleAddToCart(paper, e)} className="px-3 py-1.5 bg-gray-200 rounded-lg flex items-center justify-center">
                      {inCart ? <Trash2 size={14} className="text-red-500" /> : <ShoppingCart size={14} className="text-gray-600" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MockTestsPage;