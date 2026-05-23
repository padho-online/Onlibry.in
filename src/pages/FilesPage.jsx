// src/pages/FilesPage.jsx - Fixed Pagination Version
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { getFilesFromD1 } from '../services/d1Service';
import { logSearch } from '../services/loggerService';
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
    page: parseInt(searchParams.get('page') || '1'),
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
        // ✅ Fixed: No frontend sorting - backend already sorts properly
        setFiles(result.files || []);
        setTotalCount(result.pagination?.total || 0);
        setPagination(prev => ({
          ...prev,
          totalPages: result.pagination?.totalPages || 1
        }));
        
        // Update URL with current page
        if (pagination.page > 1) {
          setSearchParams({ 
            ...(searchQuery && { search: searchQuery }),
            page: pagination.page.toString()
          });
        } else if (pagination.page === 1 && searchQuery) {
          setSearchParams({ search: searchQuery });
        } else if (pagination.page === 1 && !searchQuery) {
          setSearchParams({});
        }
        
        // Log search to Google Sheet
        if (searchQuery.trim() && user && result.pagination?.total !== undefined) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(async () => {
            const currentQuery = searchQuery.trim();
            if (lastLoggedQueryRef.current !== currentQuery) {
              lastLoggedQueryRef.current = currentQuery;
              await logSearch(
                currentQuery,
                result.pagination?.total || 0,
                location.pathname
              );
              console.log(`🔍 Search logged to Sheet: "${currentQuery}" -> ${result.pagination?.total || 0} results`);
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
  }, [pagination.page, pagination.limit, searchQuery, user, location.pathname, setSearchParams]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery, page: '1' });
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setSearchParams({});
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    setPagination({ page: 1, limit: 20, totalPages: 1 });
    lastLoggedQueryRef.current = '';
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync search query with URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');
    
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
    
    if (urlPage !== pagination.page && urlPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: urlPage }));
    }
  }, [searchParams, searchQuery, pagination.page, pagination.totalPages]);

  useEffect(() => {
    loadFiles();
  }, [pagination.page, searchQuery, loadFiles]);

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
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
          Search
        </button>
        {searchQuery && (
          <button 
            type="button" 
            onClick={handleClearSearch} 
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
          >
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
          Showing {files.length} of {totalCount} file{totalCount !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : files.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
            <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className={`px-3 py-2 rounded-lg text-sm ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                First
              </button>
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
              
              <div className="flex gap-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = idx + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + idx;
                  } else {
                    pageNum = pagination.page - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        pagination.page === pageNum
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
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
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-2 rounded-lg text-sm ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last
              </button>
            </div>
          )}
          
          {/* Page info for mobile */}
          <div className="text-center text-xs text-gray-500 mt-4 md:hidden">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No files found.</p>
          {searchQuery && (
            <button onClick={handleClearSearch} className="mt-3 text-green-600 text-sm hover:underline">
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FilesPage;