// src/pages/FoldersPage.jsx
// UPDATED: File Manager View (Cards) + Tree View (List) with single toggle button

import React, { useState, useEffect } from 'react';
import { getAllFolders, buildFolderTree, searchFolders } from '../services/folderService';
import FolderTree from '../components/FolderTree';
import { useNavigate } from 'react-router-dom';

function FoldersPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [tree, setTree] = useState({});
  const [stats, setStats] = useState({ folderCount: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFolders, setFilteredFolders] = useState([]);
  
  // 🔥 View mode: 'filemanager' (default) or 'tree'
  const [viewMode, setViewMode] = useState('filemanager');
  
  // 🔥 File Manager navigation
  const [currentPath, setCurrentPath] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentItems, setCurrentItems] = useState([]);

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
    
    // Initialize file manager with root
    initializeFileManager(folderTree);
    
    setLoading(false);
  };

  // 🔥 Initialize file manager view
  const initializeFileManager = (treeData) => {
    const items = Object.keys(treeData).map(name => ({
      name: name,
      type: 'folder',
      data: treeData[name],
      isLeaf: treeData[name].isLeaf || false,
      link: treeData[name].link || ''
    }));
    setCurrentItems(items);
    setCurrentNode(treeData);
    setCurrentPath([]);
  };

  // 🔥 Navigate into a folder (File Manager View)
  const openFolder = (folderName, folderData) => {
    // Check if it's a leaf (file)
    if (folderData.isLeaf) {
      if (folderData.link) {
        window.open(folderData.link, '_self');
      } else {
        const searchTerm = encodeURIComponent(`subpage:${[...currentPath, folderName].join(' ').toLowerCase()}`);
        navigate(`/files?search=${searchTerm}`);
      }
      return;
    }
    
    // Navigate into subfolder
    const newPath = [...currentPath, folderName];
    const children = folderData.children || {};
    const items = Object.keys(children).map(name => ({
      name: name,
      type: 'folder',
      data: children[name],
      isLeaf: children[name].isLeaf || false,
      link: children[name].link || ''
    }));
    
    setCurrentItems(items);
    setCurrentNode(children);
    setCurrentPath(newPath);
  };

  // 🔥 Go back to parent folder
  const goBack = () => {
    if (currentPath.length === 0) return;
    
    const newPath = [...currentPath];
    newPath.pop();
    
    // Navigate to root or parent
    let current = tree;
    for (const segment of newPath) {
      if (current[segment]) {
        current = current[segment].children;
      } else {
        current = tree;
        break;
      }
    }
    
    const items = Object.keys(current).map(name => ({
      name: name,
      type: 'folder',
      data: current[name],
      isLeaf: current[name].isLeaf || false,
      link: current[name].link || ''
    }));
    
    setCurrentItems(items);
    setCurrentNode(current);
    setCurrentPath(newPath);
  };

  // 🔥 Go to root
  const goToRoot = () => {
    const items = Object.keys(tree).map(name => ({
      name: name,
      type: 'folder',
      data: tree[name],
      isLeaf: tree[name].isLeaf || false,
      link: tree[name].link || ''
    }));
    setCurrentItems(items);
    setCurrentNode(tree);
    setCurrentPath([]);
  };

  // 🔥 Go to specific breadcrumb
  const goToBreadcrumb = (index) => {
    const newPath = currentPath.slice(0, index + 1);
    let current = tree;
    for (const segment of newPath) {
      if (current[segment]) {
        current = current[segment].children;
      }
    }
    
    const items = Object.keys(current).map(name => ({
      name: name,
      type: 'folder',
      data: current[name],
      isLeaf: current[name].isLeaf || false,
      link: current[name].link || ''
    }));
    
    setCurrentItems(items);
    setCurrentNode(current);
    setCurrentPath(newPath);
  };

  // 🔥 Toggle view mode
  const toggleViewMode = () => {
    if (viewMode === 'filemanager') {
      setViewMode('tree');
    } else {
      setViewMode('filemanager');
      // Reset file manager navigation when switching back
      initializeFileManager(tree);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredFolders(folders);
      const { tree: folderTree, folderCount, fileCount } = buildFolderTree(folders);
      setTree(folderTree);
      setStats({ folderCount, fileCount });
      initializeFileManager(folderTree);
      return;
    }
    
    const results = searchFolders(folders, searchQuery);
    setFilteredFolders(results);
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(results);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
    initializeFileManager(folderTree);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredFolders(folders);
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(folders);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
    initializeFileManager(folderTree);
  };

  // 🔥 Render File Manager View (Cards style)
  const renderFileManagerView = () => {
    return (
      <div>
        {/* Breadcrumbs */}
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2 flex-wrap">
          <button
            onClick={goToRoot}
            className="text-gray-600 dark:text-gray-400 hover:text-green-600 font-medium"
          >
            📁 Root
          </button>
          {currentPath.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className="text-gray-400">→</span>
              <button
                onClick={() => goToBreadcrumb(index)}
                className={`${
                  index === currentPath.length - 1
                    ? 'text-green-600 dark:text-green-400 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
                }`}
              >
                {crumb}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Back button */}
        {currentPath.length > 0 && (
          <button
            onClick={goBack}
            className="mb-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2"
          >
            ← Back
          </button>
        )}

        {/* Items Grid - Cards style */}
        {currentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentItems.map((item) => (
              <div
                key={item.name}
                onClick={() => openFolder(item.name, item.data)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 overflow-hidden"
              >
                <div className="p-4 text-center">
                  <div className="text-5xl mb-3">
                    {item.isLeaf ? '📄' : '📁'}
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-white truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.isLeaf ? 'File' : 'Folder'}
                  </p>
                  {item.link && item.isLeaf && (
                    <span className="inline-block mt-2 text-xs text-blue-500">🔗 Link</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-500 dark:text-gray-400">This folder is empty</p>
          </div>
        )}
      </div>
    );
  };

  // 🔥 Render Tree View
  const renderTreeView = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <FolderTree 
          tree={tree} 
          onFolderClick={() => {}} 
          expandedPaths={[]}
        />
      </div>
    );
  };

  return (
    <div className="py-6">
      {/* Header with Toggle Button */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Folder Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {viewMode === 'filemanager' 
                ? 'Browse folders like a file manager (click to open folders)' 
                : 'View folder hierarchy in tree structure'}
            </p>
          </div>
          
          {/* 🔥 SINGLE TOGGLE BUTTON */}
          <button
            onClick={toggleViewMode}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium rounded-lg transition shadow-md flex items-center gap-2"
          >
            {viewMode === 'filemanager' ? (
              <>
                🌲 Switch to Tree View
              </>
            ) : (
              <>
                📁 Switch to File Manager
              </>
            )}
          </button>
        </div>
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
            placeholder="Search folders..."
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Content based on view mode */}
      {!loading && (
        <>
          {viewMode === 'filemanager' ? renderFileManagerView() : renderTreeView()}
        </>
      )}

      {/* No Results */}
      {!loading && Object.keys(tree).length === 0 && !searchQuery && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">No folders available.</p>
        </div>
      )}
    </div>
  );
}

export default FoldersPage;