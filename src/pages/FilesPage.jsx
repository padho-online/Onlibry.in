// src/pages/FilesPage.jsx - with Exact/Subpage/Basic Search + URL Routes
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { getFilesFromD1 } from '../services/d1Service';
import { logSearch } from '../services/loggerService';
import { useAuth } from '../contexts/AuthContext';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

function FilesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode: urlMode, query: urlQuery } = useParams();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('basic');
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [allFiles, setAllFiles] = useState([]);
  const [subpageFilteredFiles, setSubpageFilteredFiles] = useState([]); // For subpage nested search
  
  const debounceTimerRef = useRef(null);
  const lastLoggedQueryRef = useRef('');

  // Parse URL parameters and update state
  useEffect(() => {
    let mode = 'basic';
    let query = '';
    
    if (urlMode && ['basic', 'exact', 'subpage'].includes(urlMode)) {
      mode = urlMode;
      if (urlQuery) {
        const queryPart = Array.isArray(urlQuery) ? urlQuery.join('/') : urlQuery;
        query = decodeURIComponent(queryPart.replace(/\+/g, ' '));
      }
    } else if (urlMode && !['basic', 'exact', 'subpage'].includes(urlMode)) {
      const queryPart = Array.isArray(urlMode) ? urlMode.join('/') : urlMode;
      query = decodeURIComponent(queryPart.replace(/\+/g, ' '));
      mode = 'basic';
    } else if (!urlMode && urlQuery) {
      const queryPart = Array.isArray(urlQuery) ? urlQuery.join('/') : urlQuery;
      query = decodeURIComponent(queryPart.replace(/\+/g, ' '));
      mode = 'basic';
    }
    
    setSearchMode(mode);
    setActiveSearchQuery(query);
    
    // Set search input value
    if (mode === 'subpage') {
      setSearchInputValue('');
    } else if (mode === 'exact' && query) {
      setSearchInputValue(`exact: ${query}`);
    } else if (mode === 'basic' && query) {
      setSearchInputValue(query);
    } else {
      setSearchInputValue('');
    }
    
    // Reset subpage filtered files when mode changes
    if (mode !== 'subpage') {
      setSubpageFilteredFiles([]);
    }
    
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [urlMode, urlQuery]);

  // AND condition filter
  const filterExactMatch = useCallback((filesList, query) => {
    if (!query.trim()) return filesList;
    const searchWords = query.toLowerCase().trim().split(/\s+/);
    return filesList.filter(file => {
      const searchableText = `${file.name || ''} ${file.tags || ''}`.toLowerCase();
      return searchWords.every(word => searchableText.includes(word));
    });
  }, []);

  // OR condition filter
  const filterBasicMatch = useCallback((filesList, query) => {
    if (!query.trim()) return filesList;
    const searchWords = query.toLowerCase().trim().split(/\s+/);
    return filesList.filter(file => {
      const searchableText = `${file.name || ''} ${file.tags || ''}`.toLowerCase();
      return searchWords.some(word => searchableText.includes(word));
    });
  }, []);

  // Load all files
  const loadAllFiles = useCallback(async () => {
    try {
      const result = await getFilesFromD1(1, 9999, '');
      if (result.success) {
        setAllFiles(result.files || []);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (error) {
      console.error('Error loading all files:', error);
      setError('Failed to load files');
    }
  }, []);

  // Apply filters and pagination
  const applyFiltersAndPaginate = useCallback(() => {
    let filteredFiles = [];
    
    // For subpage mode: first apply the subpage query filter, then apply nested search if any
    if (searchMode === 'subpage') {
      if (subpageFilteredFiles.length > 0) {
        // We already have subpage filtered files, now apply nested search
        if (activeSearchQuery.trim()) {
          // Nested search uses BASIC (OR) mode on the subpage results
          filteredFiles = filterBasicMatch(subpageFilteredFiles, activeSearchQuery);
        } else {
          filteredFiles = [...subpageFilteredFiles];
        }
      } else if (activeSearchQuery.trim()) {
        // Initial subpage search - apply AND filter to all files
        filteredFiles = filterExactMatch(allFiles, activeSearchQuery);
        setSubpageFilteredFiles(filteredFiles);
      } else {
        filteredFiles = [...allFiles];
      }
    } else {
      // Basic or Exact mode
      filteredFiles = [...allFiles];
      if (activeSearchQuery.trim()) {
        if (searchMode === 'basic') {
          filteredFiles = filterBasicMatch(filteredFiles, activeSearchQuery);
        } else { // exact mode
          filteredFiles = filterExactMatch(filteredFiles, activeSearchQuery);
        }
      }
    }
    
    // Sort: premium files at bottom
    filteredFiles.sort((a, b) => {
      if (a.is_premium === b.is_premium) return 0;
      return a.is_premium ? 1 : -1;
    });
    
    const total = filteredFiles.length;
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const paginatedFiles = filteredFiles.slice(start, end);
    
    setFiles(paginatedFiles);
    setTotalCount(total);
    setPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(total / prev.limit) || 1
    }));
    
    // Log search
    if (activeSearchQuery.trim() && user) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(async () => {
        const currentQuery = activeSearchQuery.trim();
        if (lastLoggedQueryRef.current !== currentQuery) {
          lastLoggedQueryRef.current = currentQuery;
          await logSearch(currentQuery, total, location.pathname, searchMode);
        }
      }, 800);
    }
    
    setLoading(false);
  }, [allFiles, activeSearchQuery, searchMode, pagination.page, pagination.limit, filterBasicMatch, filterExactMatch, subpageFilteredFiles, user, location.pathname]);

  // Load all files on mount
  useEffect(() => {
    loadAllFiles();
  }, [loadAllFiles]);

  // Apply filters when dependencies change
  useEffect(() => {
    if (allFiles.length) {
      setLoading(true);
      applyFiltersAndPaginate();
    }
  }, [applyFiltersAndPaginate, allFiles.length]);

  // Detect mode from input
  const detectModeFromInput = (inputText) => {
    const trimmed = inputText.trim();
    if (trimmed.startsWith('exact:')) {
      let query = trimmed.substring(6).trim();
      return { mode: 'exact', query: query };
    } else if (trimmed.startsWith('subpage:')) {
      let query = trimmed.substring(8).trim();
      return { mode: 'subpage', query: query };
    } else {
      return { mode: 'basic', query: trimmed };
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchInputValue.trim()) {
      navigate('/files');
      setActiveSearchQuery('');
      setSearchInputValue('');
      setSubpageFilteredFiles([]);
      setPagination(prev => ({ ...prev, page: 1 }));
      return;
    }
    
    const { mode, query } = detectModeFromInput(searchInputValue);
    
    if (!query) {
      navigate('/files');
      setActiveSearchQuery('');
      setSubpageFilteredFiles([]);
      setPagination(prev => ({ ...prev, page: 1 }));
      return;
    }
    
    setSearchMode(mode);
    setActiveSearchQuery(query);
    
    if (mode === 'subpage') {
      setSearchInputValue('');
      setSubpageFilteredFiles([]); // Clear so it refilters
    }
    
    const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');
    navigate(`/files/search/${mode}/${encodedQuery}`);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle nested search within subpage results
  const handleSubpageNestedSearch = (e) => {
    e.preventDefault();
    
    if (!searchInputValue.trim()) {
      // If empty, just show the subpage results without additional filter
      setActiveSearchQuery('');
      setPagination(prev => ({ ...prev, page: 1 }));
      return;
    }
    
    // Nested search uses basic mode on existing subpage results
    setActiveSearchQuery(searchInputValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearchInputValue('');
    setActiveSearchQuery('');
    setSearchMode('basic');
    setSubpageFilteredFiles([]);
    navigate('/files');
    setPagination(prev => ({ ...prev, page: 1 }));
    lastLoggedQueryRef.current = '';
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const getPlaceholder = () => {
    if (searchMode === 'subpage') {
      return 'Search within results...';
    }
    return 'Search files... (exact: "query" for exact match)';
  };

  // Determine form submit handler based on mode
  const formSubmitHandler = searchMode === 'subpage' ? handleSubpageNestedSearch : handleSearch;

  return (
    <div className="py-3 md:py-6">
      <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">Resources</h1>
      <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Books, PYQs, notes & more</p>

      <form onSubmit={formSubmitHandler} className="flex gap-2 mb-4 md:mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
          Search
        </button>
        {(activeSearchQuery || location.pathname !== '/files') && (
          <button type="button" onClick={handleClearSearch} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            <X size={16} />
          </button>
        )}
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <p className="text-xs text-gray-500 mb-3">
          {totalCount} file{totalCount !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : files.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
            {files.map(file => (
              <FileCard 
                key={file.id} 
                file={{
                  id: file.id,
                  name: file.name,
                  size: file.size,
                  price: file.price,
                  isPremium: file.is_premium === 1,
                  showOnWebsite: file.show_on_website === 1,
                  tagsString: file.tags,
                  cloudflareKey: file.cloudflare_key,
                  mimeType: file.mime_type
                }} 
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No files found.</p>
          {activeSearchQuery && (
            <button onClick={handleClearSearch} className="mt-3 text-green-600 text-sm">
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilesPage;