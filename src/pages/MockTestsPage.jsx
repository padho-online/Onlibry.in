import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllExams, processExamPapers, getExamCategories, getSubCategories } from '../services/mockTestService';

function MockTestsPage() {
  const [allPapers, setAllPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedSub, setSelectedSub] = useState('all');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedExam, selectedSub, searchQuery, allPapers]);

  useEffect(() => {
    if (selectedExam !== 'all') {
      const subs = getSubCategories(allPapers, selectedExam);
      setSubCategories(subs);
      setSelectedSub('all');
    } else {
      setSubCategories([]);
      setSelectedSub('all');
    }
  }, [selectedExam, allPapers]);

  const loadExams = async () => {
    setLoading(true);
    const exams = await getAllExams();
    const processed = processExamPapers(exams);
    setAllPapers(processed);
    setFilteredPapers(processed);
    
    const cats = getExamCategories(processed);
    setCategories(cats);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allPapers];
    
    // Filter by exam category
    if (selectedExam !== 'all') {
      filtered = filtered.filter(p => p.baseKey === selectedExam);
    }
    
    // Filter by sub category
    if (selectedSub !== 'all') {
      filtered = filtered.filter(p => p.subKey === selectedSub);
    }
    
    // Filter by search query
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
    setSelectedExam('all');
    setSelectedSub('all');
    setSearchQuery('');
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Mock Tests
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Practice with real exam patterns and boost your preparation
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-8">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for exam papers..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Exam Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedExam('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedExam === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedExam(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedExam === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        
        {/* Sub Filters (if any) */}
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
        
        {/* Clear Filters Button */}
        {(selectedExam !== 'all' || selectedSub !== 'all' || searchQuery) && (
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
          Found {filteredPapers.length} test{filteredPapers.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Papers Grid */}
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
                  to={`/mock-test/${encodeURIComponent(paper.originalName)}`}
                  className="block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                >
                  Start Test
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
            No mock tests found matching your criteria.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 text-green-600 dark:text-green-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default MockTestsPage;