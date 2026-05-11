// src/pages/FoldersPage.jsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFolders, buildFolderTree, searchFolders } from '../services/folderService';
import { Folder, File, Search, X, ChevronRight, ChevronDown } from 'lucide-react';

function FoldersPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [tree, setTree] = useState({});
  const [stats, setStats] = useState({ folderCount: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('filemanager');
  const [currentPath, setCurrentPath] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    const folderData = await getAllFolders();
    setFolders(folderData);
    
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(folderData);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
    initializeFileManager(folderTree);
    setLoading(false);
  };

  const initializeFileManager = (treeData) => {
    const items = Object.keys(treeData).map(name => ({
      name: name,
      type: treeData[name].isLeaf ? 'file' : 'folder',
      data: treeData[name],
      link: treeData[name].link || ''
    }));
    setCurrentItems(items);
    setCurrentPath([]);
  };

  const openFolder = (folderName, folderData) => {
    if (folderData.isLeaf) {
      if (folderData.link) window.open(folderData.link, '_self');
      else navigate(`/files?search=subpage:${[...currentPath, folderName].join(' ').toLowerCase()}`);
      return;
    }
    
    const newPath = [...currentPath, folderName];
    const children = folderData.children || {};
    const items = Object.keys(children).map(name => ({
      name: name,
      type: children[name].isLeaf ? 'file' : 'folder',
      data: children[name],
      link: children[name].link || ''
    }));
    setCurrentItems(items);
    setCurrentPath(newPath);
  };

  const goBack = () => {
    if (currentPath.length === 0) return;
    const newPath = [...currentPath];
    newPath.pop();
    let current = tree;
    for (const segment of newPath) {
      if (current[segment]) current = current[segment].children;
      else { current = tree; break; }
    }
    const items = Object.keys(current).map(name => ({
      name: name,
      type: current[name].isLeaf ? 'file' : 'folder',
      data: current[name],
      link: current[name].link || ''
    }));
    setCurrentItems(items);
    setCurrentPath(newPath);
  };

  const goToRoot = () => {
    const items = Object.keys(tree).map(name => ({
      name: name,
      type: tree[name].isLeaf ? 'file' : 'folder',
      data: tree[name],
      link: tree[name].link || ''
    }));
    setCurrentItems(items);
    setCurrentPath([]);
  };

  const toggleExpand = (pathKey, e) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(pathKey)) newExpanded.delete(pathKey);
    else newExpanded.add(pathKey);
    setExpandedPaths(newExpanded);
  };

  const renderTree = (nodes, currentPathArr = []) => {
    const sortedNames = Object.keys(nodes).sort();
    return sortedNames.map(name => {
      const node = nodes[name];
      const pathKey = [...currentPathArr, name].join('/');
      const isExpanded = expandedPaths.has(pathKey);
      const hasChildren = Object.keys(node.children).length > 0;
      
      return (
        <div key={pathKey} className="mb-1">
          <div
            className={`flex items-center p-2 rounded-lg cursor-pointer ${node.isLeaf ? 'hover:bg-green-50' : 'hover:bg-gray-50'}`}
            onClick={() => node.isLeaf ? (node.link ? window.open(node.link, '_self') : navigate(`/files?search=subpage:${[...currentPathArr, name].join(' ').toLowerCase()}`)) : openFolder(name, node)}
          >
            {hasChildren && (
              <button onClick={(e) => toggleExpand(pathKey, e)} className="w-6 h-6 flex items-center justify-center text-gray-500">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {!hasChildren && <div className="w-6"></div>}
            {node.isLeaf ? <File size={16} className="text-green-600 mr-2" /> : <Folder size={16} className="text-orange-500 mr-2" />}
            <span className={`text-sm ${node.isLeaf ? 'text-green-600 font-medium' : 'text-gray-700'}`}>{name}</span>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-6 pl-2 border-l-2 border-gray-200">
              {renderTree(node.children, [...currentPathArr, name])}
            </div>
          )}
        </div>
      );
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { await loadFolders(); return; }
    const results = searchFolders(folders, searchQuery);
    const { tree: folderTree, folderCount, fileCount } = buildFolderTree(results);
    setTree(folderTree);
    setStats({ folderCount, fileCount });
    initializeFileManager(folderTree);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="py-3 md:py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Folder Hub</h1>
        <button onClick={() => setViewMode(viewMode === 'filemanager' ? 'tree' : 'filemanager')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
          {viewMode === 'filemanager' ? <Folder size={14} /> : <File size={14} />}
          <span>{viewMode === 'filemanager' ? 'Tree View' : 'File Manager'}</span>
        </button>
      </div>

     {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-green-600">{stats.folderCount}</div>
          <div className="text-[10px] text-gray-500">Folders</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-orange-600">{stats.fileCount}</div>
          <div className="text-[10px] text-gray-500">Files</div>
        </div>
      </div> */}

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search folders..." className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg" />
        </div>
        <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs">Search</button>
        {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); loadFolders(); }} className="px-3 py-2 bg-gray-200 rounded-lg"><X size={14} /></button>}
      </form>

      {viewMode === 'filemanager' ? (
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 flex-wrap">
            <button onClick={goToRoot} className="text-green-600">Root</button>
            {currentPath.map((crumb, idx) => (
              <React.Fragment key={idx}><ChevronRight size={12} /><span className="text-gray-700">{crumb}</span></React.Fragment>
            ))}
          </div>
          {currentPath.length > 0 && (
            <button onClick={goBack} className="mb-3 px-3 py-1.5 bg-gray-200 rounded-lg text-xs flex items-center gap-1">← Back</button>
          )}
          <div className="grid grid-cols-3 gap-3">
            {currentItems.map(item => (
              <div key={item.name} onClick={() => openFolder(item.name, item.data)} className="bg-white rounded-xl shadow-md p-3 border border-gray-200 cursor-pointer text-center">
                {item.type === 'folder' ? <Folder size={24} className="text-orange-500 mx-auto mb-2" /> : <File size={24} className="text-green-600 mx-auto mb-2" />}
                <h3 className="text-sm font-medium text-gray-800 truncate">{item.name}</h3>
                <p className="text-[10px] text-gray-400 mt-1">{item.type === 'folder' ? 'Folder' : 'File'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-3 border border-gray-200">
          {renderTree(tree)}
        </div>
      )}
    </div>
  );
}

export default FoldersPage;