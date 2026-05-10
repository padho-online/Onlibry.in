// src/pages/FilesPage.jsx
// UPDATED - Free files first sorting + debug logs + pagination

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

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  // Load files with pagination
  const loadFiles = useCallback(async (isSearch = false, loadMore = false) => {

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      console.log(
        '📂 Loading files - Search:',
        isSearch,
        'Query:',
        searchQuery,
        'LoadMore:',
        loadMore
      );

      // SEARCH MODE
      if (isSearch && searchQuery) {

        console.log('🔍 Searching for:', searchQuery);

        const results = await searchFiles(searchQuery);

        // 🔥 Sort free files first
        results.sort((a, b) => {
          if (a.isPremium === b.isPremium) return 0;
          return a.isPremium ? 1 : -1;
        });

        console.log('✅ Search results:', results.length);

        setFiles(results);
        setHasMore(false);
        setTotalCount(results.length);

      } else {

        // NORMAL FILE LOAD
        console.log(
          '📄 Fetching all files, page:',
          loadMore ? 'next' : 'first'
        );

        const result = await getAllFiles(
          loadMore ? lastVisible : null,
          20
        );

        console.log('✅ API Response:', {
          filesCount: result.files?.length || 0,
          hasMore: result.hasMore,
          lastVisible: result.lastVisible
        });

        const newFiles = result.files || [];

        // 🔥 Sort free files first
        newFiles.sort((a, b) => {
          if (a.isPremium === b.isPremium) return 0;
          return a.isPremium ? 1 : -1;
        });

        if (loadMore) {

          setFiles(prev => {

            const existingIds = new Set(prev.map(f => f.id));

            const uniqueNewFiles = newFiles.filter(
              f => !existingIds.has(f.id)
            );

            console.log(
              `📊 Adding ${uniqueNewFiles.length} new files`
            );

            // Merge + sort again
            const merged = [...prev, ...uniqueNewFiles];

            merged.sort((a, b) => {
              if (a.isPremium === b.isPremium) return 0;
              return a.isPremium ? 1 : -1;
            });

            return merged;
          });

          setTotalCount(prev => prev + newFiles.length);

        } else {

          setFiles(newFiles);
          setTotalCount(newFiles.length);
        }

        setLastVisible(result.lastVisible);
        setHasMore(result.hasMore === true);
      }

    } catch (error) {

      console.error('❌ Error loading files:', error);

      setError(
        error.message || 'Failed to load files. Please refresh the page.'
      );

    } finally {

      setLoading(false);
      setLoadingMore(false);
    }

  }, [searchQuery, lastVisible]);

  // Load More
  const handleLoadMore = () => {

    if (!loadingMore && hasMore && !searchQuery) {

      console.log('📥 Loading more files...');

      loadFiles(false, true);
    }
  };

  // Search
  const handleSearch = async (e) => {

    e.preventDefault();

    if (searchQuery.trim()) {

      console.log('🔍 Search submitted:', searchQuery);

      setSearchParams({ search: searchQuery });

      setLoading(true);
      setError(null);

      try {

        const results = await searchFiles(searchQuery);

        // 🔥 Sort free files first
        results.sort((a, b) => {
          if (a.isPremium === b.isPremium) return 0;
          return a.isPremium ? 1 : -1;
        });

        console.log('✅ Search results count:', results.length);

        setFiles(results);
        setHasMore(false);
        setTotalCount(results.length);

        logSearch(
          searchQuery,
          results.length,
          searchQuery.toLowerCase().startsWith('exact:')
        );

      } catch (error) {

        console.error('❌ Search error:', error);

        setError('Search failed. Please try again.');

      } finally {

        setLoading(false);
      }

    } else {

      console.log('🔄 Clearing search, loading all files');

      setSearchParams({});
      setSearchQuery('');

      loadFiles(false, false);
    }
  };

  // Clear Search
  const handleClearSearch = () => {

    console.log('🧹 Clearing search');

    setSearchQuery('');
    setSearchParams({});

    loadFiles(false, false);
  };

  // Initial Load
  useEffect(() => {

    const hasSearchParam = !!searchParams.get('search');

    console.log(
      '🚀 Initial load - Has search param:',
      hasSearchParam
    );

    loadFiles(hasSearchParam, false);

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

        <form
          onSubmit={handleSearch}
          className="flex gap-2 max-w-2xl"
        >

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for files, subjects, courses..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
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
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Clear
            </button>
          )}

        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">

          <strong>Error:</strong> {error}

          <button
            onClick={() => loadFiles(false, false)}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <div className="flex justify-between items-center mb-4">

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found {totalCount} file{totalCount !== 1 ? 's' : ''}
          </p>

          {searchQuery && (
            <p className="text-xs text-gray-400">
              Search results for "{searchQuery}"
            </p>
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
      {!loading && !error && files.length > 0 && (
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
              />
            ))}

          </div>

          {/* Load More */}
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

          {/* End */}
          {!hasMore && files.length > 0 && !searchQuery && (
            <p className="text-center text-gray-400 text-sm mt-6">
              You've reached the end — {files.length} files loaded
            </p>
          )}

        </>
      )}

      {/* Empty */}
      {!loading && !error && files.length === 0 && (
        <div className="text-center py-20">

          <div className="text-6xl mb-4">
            📚
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchQuery
              ? 'No files found matching your search.'
              : 'No files available at the moment.'}
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