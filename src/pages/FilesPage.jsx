import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { getAllFilesFromCloud } from '../services/cloudFunctions';
import { searchFiles } from '../services/fileService';
import { logSearch } from '../services/loggerService';

function FilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [lastId, setLastId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load files using Cloud Function
  const loadFiles = useCallback(async (isSearch = false, loadMore = false) => {
    if (!loadMore) setLoading(true);

    try {
      if (isSearch && searchQuery) {
        const results = await searchFiles(searchQuery);
        setFiles(results);
        setHasMore(false);
        setLoading(false);
        return results;
      } else {
        const currentLastId = loadMore ? lastId : null;
        const result = await getAllFilesFromCloud(20, currentLastId);
        
        if (result.success) {
          if (loadMore) {
            setFiles(prev => [...prev, ...result.files]);
          } else {
            setFiles(result.files);
          }
          setLastId(result.lastId);
          setHasMore(result.hasMore);
        }
        
        setLoading(false);
        return result.files || [];
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setLoading(false);
      return [];
    }
  }, [searchQuery, lastId]);

  // Load more files
  const loadMore = async () => {
    if (loadingMore || !hasMore || searchQuery) return;
    
    setLoadingMore(true);
    await loadFiles(false, true);
    setLoadingMore(false);
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
      const results = await loadFiles(true);
      logSearch(searchQuery, results.length, searchQuery.toLowerCase().startsWith('exact:'));
    } else {
      setSearchParams({});
      loadFiles(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    loadFiles(false);
  };

  // Initial load
  useEffect(() => {
    loadFiles(!!searchParams.get('search'));
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

      {/* Search */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for files, subjects, courses..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Found {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loader */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Files grid */}
      {!loading && files.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>

          {hasMore && !searchQuery && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {/* No results */}
      {!loading && files.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchQuery ? 'No files found matching your search.' : 'No files available.'}
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