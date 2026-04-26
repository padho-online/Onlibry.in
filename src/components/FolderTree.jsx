import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FolderTree({ tree, onFolderClick, expandedPaths = [] }) {
  const [expanded, setExpanded] = useState(new Set(expandedPaths));
  const navigate = useNavigate();

  const toggleExpand = (pathKey, e) => {
    e.stopPropagation();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(pathKey)) {
      newExpanded.delete(pathKey);
    } else {
      newExpanded.add(pathKey);
    }
    setExpanded(newExpanded);
  };

  const handleFolderClick = (name, path, node, e) => {
    e.stopPropagation();
    if (!node.isLeaf && onFolderClick) {
      onFolderClick([...path, name]);
    }
    if (node.isLeaf && node.link) {
      window.open(node.link, '_self');
    } else if (node.isLeaf && !node.link) {
      const searchTerm = encodeURIComponent(`subpage:${[...path, name].join(' ').toLowerCase()}`);
      navigate(`/files?search=${searchTerm}`);
    }
  };

  const renderTree = (nodes, currentPath = []) => {
    const sortedNames = Object.keys(nodes).sort((a, b) => a.localeCompare(b));
    
    return sortedNames.map(name => {
      const node = nodes[name];
      const currentPathWithName = [...currentPath, name];
      const pathKey = currentPathWithName.join('/');
      const isExpanded = expanded.has(pathKey);
      const hasChildren = Object.keys(node.children).length > 0;
      
      return (
        <div key={pathKey} className="mb-1">
          <div
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
              node.isLeaf 
                ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={(e) => handleFolderClick(name, currentPath, node, e)}
          >
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <button
                onClick={(e) => toggleExpand(pathKey, e)}
                className="w-6 h-6 flex items-center justify-center mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <div className="w-6 mr-2"></div>}
            
            {/* Icon */}
            <span className="mr-2 text-lg">
              {node.isLeaf ? '📄' : '📁'}
            </span>
            
            {/* Name */}
            <span className={`flex-1 ${
              node.isLeaf 
                ? 'text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {name}
            </span>
            
            {/* Leaf indicator */}
            {node.isLeaf && (
              <span className="text-xs text-gray-400">↗</span>
            )}
          </div>
          
          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              {renderTree(node.children, currentPathWithName)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="folder-tree">
      {renderTree(tree)}
    </div>
  );
}

export default FolderTree;