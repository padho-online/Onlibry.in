// src/pages/FilesPage.jsx - Complete with responsive grid
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FileCard from '../components/FileCard';
import { getAllFiles, searchFiles } from '../services/fileService';
import { Search, X } from 'lucide-react';

function FilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  const loadFiles = useCallback(async (isSearch = false) => {
    setLoading(true);
    setError(null);
    try {
      if (isSearch && searchQuery) {
        const results = await searchFiles(searchQuery);
        results.sort((a, b) => a.isPremium === b.isPremium ? 0 : a.isPremium ? 1 : -1);
        setFiles(results);
        setTotalCount(results.length);
      } else {
        const result = await getAllFiles(null, 100);
        const newFiles = result.files || [];
        newFiles.sort((a, b) => a.isPremium === b.isPremium ? 0 : a.isPremium ? 1 : -1);
        setFiles(newFiles);
        setTotalCount(newFiles.length);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
      await loadFiles(true);
    } else {
      setSearchParams({});
      await loadFiles(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    loadFiles(false);
  };

  useEffect(() => {
    loadFiles(!!searchParams.get('search'));
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
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Search</button>
        {searchQuery && (
          <button type="button" onClick={handleClearSearch} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            <X size={16} />
          </button>
        )}
      </form>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

      {!loading && !error && (
        <p className="text-xs text-gray-500 mb-3">{totalCount} file{totalCount !== 1 ? 's' : ''}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : files.length > 0 ? (
        // 🔥 RESPONSIVE GRID: 2 cols mobile, 3 cols tablet, 4 cols laptop, 5 cols desktop
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4">
          {files.map(file => <FileCard key={file.id} file={file} />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No files found.</p>
          {searchQuery && <button onClick={handleClearSearch} className="mt-3 text-green-600 text-sm">Clear search</button>}
        </div>
      )}
    </div>
  );
}

export default FilesPage;