import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { getAllFiles, searchFiles } from '../services/fileService';
import { logSearch } from '../services/loggerService';
import { useAuth } from '../contexts/AuthContext';

function FilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Load files with pagination
  const loadFiles = useCallback(async (isSearch = false, loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (isSearch && searchQuery) {
        const results = await searchFiles(searchQuery);
        setFiles(results);
        setHasMore(false);
        setTotalCount(results.length);
      } else {
        const { files: newFiles, lastVisible: last, hasMore: more } = await getAllFiles(loadMore ? lastVisible : null, 20);
        
        if (loadMore) {
          setFiles(prev => [...prev, ...newFiles]);
        } else {
          setFiles(newFiles);
        }
        
        setLastVisible(last);
        setHasMore(more);
        setTotalCount(prev => loadMore ? prev + newFiles.length : newFiles.length);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, lastVisible]);

  // Load more handler
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !searchQuery) {
      loadFiles(false, true);
    }
  };

  // Search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
      setLoading(true);
      const results = await searchFiles(searchQuery);
      setFiles(results);
      setHasMore(false);
      setTotalCount(results.length);
      setLoading(false);
      logSearch(searchQuery, results.length, searchQuery.toLowerCase().startsWith('exact:'));
    } else {
      setSearchParams({});
      loadFiles(false, false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    loadFiles(false, false);
  };

  // Initial load
  useEffect(() => {
    loadFiles(!!searchParams.get('search'), false);
  }, []);

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Educational Resources
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse our collection of books, PYQs, notes, and more
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for files, subjects, courses..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition">
            Search
          </button>
          {searchQuery && (
            <button type="button" onClick={handleClearSearch} className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found {totalCount} file{totalCount !== 1 ? 's' : ''}
          </p>
          {searchQuery && (
            <p className="text-xs text-gray-400">Search results for "{searchQuery}"</p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Files Grid */}
      {!loading && files.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && !searchQuery && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </span>
                ) : (
                  'Load More Files'
                )}
              </button>
            </div>
          )}
          
          {/* No more files indicator */}
          {!hasMore && files.length > 0 && !searchQuery && (
            <p className="text-center text-gray-400 text-sm mt-6">
              You've reached the end — {files.length} files loaded
            </p>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && files.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchQuery ? 'No files found matching your search.' : 'No files available at the moment.'}
          </p>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="mt-4 px-4 py-2 text-green-600 dark:text-green-400 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilesPage;