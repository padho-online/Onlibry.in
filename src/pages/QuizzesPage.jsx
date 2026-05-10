// src/pages/QuizzesPage.jsx
// COMPLETE FIXED - Subscribe button adds to cart and redirects to pricing cart tab

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPapers, getAllCategories, getSubCategoriesForCategory, refreshQuizzes } from '../services/quizService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

function QuizzesPage() {
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

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const allPapers = await getAllPapers();
      const allCategories = await getAllCategories();
      
      console.log('📊 Quizzes:', allPapers.length);
      console.log('📊 Free:', allPapers.filter(p => p.isFree).length);
      console.log('📊 Premium:', allPapers.filter(p => !p.isFree).length);
      
      setPapers(allPapers);
      setFilteredPapers(allPapers);
      setCategories(allCategories);
      
      // Check cart status for each quiz
      const status = {};
      allPapers.forEach(paper => {
        status[paper.id] = isInCart(paper.id);
      });
      setCartStatus(status);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update cart status when cart changes
  useEffect(() => {
    const status = {};
    papers.forEach(paper => {
      status[paper.id] = isInCart(paper.id);
    });
    setCartStatus(status);
  }, [isInCart, papers]);

  // Apply filters
  useEffect(() => {
    let filtered = [...papers];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (selectedSubCategory !== 'all') {
      filtered = filtered.filter(p => p.subCategory === selectedSubCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.displayName.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query))
      );
    }
    
    // Sort: Free first, then premium
    filtered.sort((a, b) => {
      if (a.isFree === b.isFree) return 0;
      return a.isFree ? -1 : 1;
    });
    
    setFilteredPapers(filtered);
  }, [selectedCategory, selectedSubCategory, searchQuery, papers]);

  // Load sub-categories when category changes
  useEffect(() => {
    const loadSubs = async () => {
      if (selectedCategory !== 'all') {
        const subs = await getSubCategoriesForCategory(selectedCategory);
        setSubCategories(subs);
        setSelectedSubCategory('all');
      } else {
        setSubCategories([]);
        setSelectedSubCategory('all');
      }
    };
    loadSubs();
  }, [selectedCategory]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSearchQuery('');
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refreshQuizzes();
    await loadData();
  };

  // Handle quiz action (Start Quiz)
  const handleQuizAction = (paper) => {
    // Free quiz - direct access
    if (paper.isFree) {
      navigate(`/quiz/${encodeURIComponent(paper.originalName)}`);
      return;
    }
    
    // Premium quiz - check subscription
    if (!user) {
      navigate('/login', { state: { from: '/quizzes' } });
      return;
    }
    
    if (isSubscribed) {
      // Subscribed user - direct access
      navigate(`/quiz/${encodeURIComponent(paper.originalName)}`);
      return;
    }
    
    // Not subscribed - should not reach here (buttons handle it)
  };

  // Handle add to cart
  const handleAddToCart = (paper, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: '/quizzes' } });
      return;
    }
    
    addToCart({
      id: paper.id,
      name: paper.displayName,
      price: paper.price || 29,
      type: 'quiz',
      originalName: paper.originalName,
      duration: paper.duration,
      positiveMark: paper.positiveMark,
      negativeMark: paper.negativeMark
    });
    setCartStatus(prev => ({ ...prev, [paper.id]: true }));
    alert(`✅ "${paper.displayName}" added to cart!`);
  };

  // Handle remove from cart
  const handleRemoveFromCart = (paperId, e) => {
    e.stopPropagation();
    removeFromCart(paperId);
    setCartStatus(prev => ({ ...prev, [paperId]: false }));
    alert(`🗑️ Removed from cart`);
  };

  // 🔥 FIXED: Handle subscribe - Add to cart AND redirect to pricing cart tab
  const handleSubscribe = (paper, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: '/quizzes' } });
      return;
    }
    
    // Add to cart first
    addToCart({
      id: paper.id,
      name: paper.displayName,
      price: paper.price || 29,
      type: 'quiz',
      originalName: paper.originalName,
      duration: paper.duration,
      positiveMark: paper.positiveMark,
      negativeMark: paper.negativeMark
    });
    
    // Redirect to pricing page with cart tab active
    navigate('/pricing', { state: { activeTab: 'cart' } });
  };

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Quiz Tests</h1>
        <p className="text-gray-600 dark:text-gray-400">Test your knowledge with our interactive quizzes</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-8">
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for quizzes..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {/* Categories */}
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Select Quiz Category:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sub-categories */}
        {subCategories.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Select Topic:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedSubCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All {selectedCategory}
              </button>
              {subCategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedSubCategory === sub
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-between items-center mt-4">
          {(selectedCategory !== 'all' || selectedSubCategory !== 'all' || searchQuery) && (
            <button onClick={handleClearFilters} className="text-sm text-red-600 dark:text-red-400 hover:underline">
              Clear all filters
            </button>
          )}
          <button onClick={handleRefresh} className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-auto">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Found {filteredPapers.length} quiz{filteredPapers.length !== 1 ? 'zes' : ''}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Quiz Grid */}
      {!loading && filteredPapers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper) => (
            <div 
              key={paper.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => handleQuizAction(paper)}
            >
              <div className="p-5">
                {/* Price Badge */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {paper.displayName}
                  </h3>
                  {!paper.isFree && (
                    <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                      ₹{paper.price || 29}
                    </span>
                  )}
                  {paper.isFree && (
                    <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/50 rounded-full">
                      Free
                    </span>
                  )}
                </div>
                
                {/* Duration and marks */}
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">⏱️ {paper.duration} min</span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">✅ +{paper.positiveMark}</span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">❌ -{paper.negativeMark}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  {paper.isFree ? (
                    // Free quiz - Start button
                    <button
                      onClick={() => handleQuizAction(paper)}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                    >
                      📝 Start Quiz
                    </button>
                  ) : (
                    // Premium quiz
                    isSubscribed ? (
                      // Subscribed user - Start button
                      <button
                        onClick={() => handleQuizAction(paper)}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                      >
                        📝 Start Quiz
                      </button>
                    ) : (
                      // Unsubscribed user - Subscribe + Add to Cart
                      <>
                        <button
                          onClick={(e) => handleSubscribe(paper, e)}
                          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition"
                        >
                          🔒 Subscribe ₹{paper.price || 29}
                        </button>
                        {cartStatus[paper.id] ? (
                          <button
                            onClick={(e) => handleRemoveFromCart(paper.id, e)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            title="Remove from Cart"
                          >
                            🗑️
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(paper, e)}
                            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
                            title="Add to Cart"
                          >
                            🛒
                          </button>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && filteredPapers.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No quizzes found matching your criteria.</p>
          <button onClick={handleClearFilters} className="mt-4 text-purple-600 dark:text-purple-400 hover:underline">Clear filters</button>
        </div>
      )}
    </div>
  );
}

export default QuizzesPage;