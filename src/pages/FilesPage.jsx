// src/pages/FilesPage.jsx - D1 Database Version with Search Logs
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { getFilesFromD1 } from '../services/d1Service';
import { logSearchToD1 } from '../services/d1Service';
import { useAuth } from '../contexts/AuthContext';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

function FilesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  });
  
  const debounceTimerRef = useRef(null);
  const lastLoggedQueryRef = useRef('');

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFilesFromD1(pagination.page, pagination.limit, searchQuery);
      
      if (result.success) {
        const sortedFiles = (result.files || []).sort((a, b) => {
          if (a.is_premium === b.is_premium) return 0;
          return a.is_premium ? 1 : -1;
        });
        setFiles(sortedFiles);
        setTotalCount(result.pagination?.total || 0);
        setPagination(prev => ({
          ...prev,
          totalPages: result.pagination?.totalPages || 1
        }));
        
        if (searchQuery.trim() && user && result.pagination?.total !== undefined) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(async () => {
            const currentQuery = searchQuery.trim();
            if (lastLoggedQueryRef.current !== currentQuery) {
              lastLoggedQueryRef.current = currentQuery;
              await logSearchToD1(
                user.uid,
                currentQuery,
                result.pagination?.total || 0,
                location.pathname
              );
              console.log(`🔍 Search logged: "${currentQuery}" on ${location.pathname} -> ${result.pagination?.total || 0} results`);
            }
          }, 800);
        }
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, user, location.pathname]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setSearchParams({});
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    setPagination(prev => ({ ...prev, page: 1 }));
    lastLoggedQueryRef.current = '';
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    loadFiles();
  }, [pagination.page, searchQuery]);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setPagination(prev => ({ ...prev, page: 1 }));
      lastLoggedQueryRef.current = '';
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="py-3 md:py-6">
      <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">Resources</h1>
      <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Books, PYQs, notes & more</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 md:mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
          Search
        </button>
        {searchQuery && (
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
          {searchQuery && (
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