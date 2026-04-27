import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllQuizzes, processQuizPapers, getQuizCategories, getQuizSubCategories } from '../services/quizService';

function QuizzesPage() {
  const [allPapers, setAllPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [selectedSub, setSelectedSub] = useState('all');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedQuiz, selectedSub, searchQuery, allPapers]);

  useEffect(() => {
    if (selectedQuiz !== 'all') {
      const subs = getQuizSubCategories(allPapers, selectedQuiz);
      setSubCategories(subs);
      setSelectedSub('all');
    } else {
      setSubCategories([]);
      setSelectedSub('all');
    }
  }, [selectedQuiz, allPapers]);

  const loadQuizzes = async () => {
    setLoading(true);
    const quizzes = await getAllQuizzes();
    const processed = processQuizPapers(quizzes);
    setAllPapers(processed);
    setFilteredPapers(processed);
    
    const cats = getQuizCategories(processed);
    setCategories(cats);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allPapers];
    
    if (selectedQuiz !== 'all') {
      filtered = filtered.filter(p => p.baseKey === selectedQuiz);
    }
    
    if (selectedSub !== 'all') {
      filtered = filtered.filter(p => p.subKey === selectedSub);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper =>
        paper.displayName.toLowerCase().includes(query) ||
        paper.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredPapers(filtered);
  };

  const handleClearFilters = () => {
    setSelectedQuiz('all');
    setSelectedSub('all');
    setSearchQuery('');
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Quiz Tests
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test your knowledge with our interactive quizzes
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-8">
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for quizzes..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedQuiz('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedQuiz === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedQuiz(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedQuiz === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        
        {subCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedSub('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedSub === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Sub
            </button>
            {subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSub(sub)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedSub === sub
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
        
        {(selectedQuiz !== 'all' || selectedSub !== 'all' || searchQuery) && (
          <button
            onClick={handleClearFilters}
            className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Found {filteredPapers.length} quiz{filteredPapers.length !== 1 ? 'zes' : ''}
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Quizzes Grid */}
      {!loading && filteredPapers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper, index) => (
            <div
              key={paper.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
            >
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  {paper.displayName}
                </h3>
                
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    ⏱️ {paper.duration} min
                  </span>
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    ✅ +{paper.positiveMark}
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    ❌ -{paper.negativeMark}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {paper.description}
                </p>
                
                <Link
                  to={`/quiz/${encodeURIComponent(paper.originalName)}`}
                  className="block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                >
                  Start Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredPapers.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            No quizzes found matching your criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 text-purple-600 dark:text-purple-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizzesPage;