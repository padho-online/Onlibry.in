import React, { useState, useEffect } from 'react';
import { getAllFolders, buildFolderTree, searchFolders, generateFolderLink } from '../services/folderService';
import FolderTree from '../components/FolderTree';

function FoldersPage() {
  const [folders, setFolders] = useState([]);
  const [tree, setTree] = useState({});
  const [stats, setStats] = useState({ folderCount: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    const folderData = await getAllFolders();
    setFolders(folderData);
    setFilteredFolders(folderData);
    
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(folderData);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredFolders(folders);
      const { tree: folderTree, folderCount, fileCount } = buildFolderTree(folders);
      setTree(folderTree);
      setStats({ folderCount, fileCount });
      return;
    }
    
    const results = searchFolders(folders, searchQuery);
    setFilteredFolders(results);
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(results);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredFolders(folders);
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(folders);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
  };

  const handleFolderClick = (path) => {
    setBreadcrumbs(path);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBreadcrumbClick = (index) => {
    const newPath = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newPath);
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Folder Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse through our organized collection of study materials
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.folderCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Folders</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.fileCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Files</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders... (use 'exact:' for exact match)"
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
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Tip: Use "exact: maths" for exact match search
        </p>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2 flex-wrap">
          <span className="text-gray-500">📁</span>
          <button
            onClick={() => setBreadcrumbs([])}
            className="text-gray-600 dark:text-gray-400 hover:text-green-600"
          >
            Root
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className="text-gray-400">→</span>
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`${
                  index === breadcrumbs.length - 1
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
                }`}
              >
                {crumb}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Folder Tree */}
      {!loading && Object.keys(tree).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <FolderTree 
            tree={tree} 
            onFolderClick={handleFolderClick}
            expandedPaths={breadcrumbs}
          />
        </div>
      )}

      {/* No Results */}
      {!loading && Object.keys(tree).length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No folders found matching your search.' : 'No folders available.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default FoldersPage;