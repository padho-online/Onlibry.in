// src/viewer/components/SearchBar.jsx
import React from 'react';

const SearchBar = ({ 
  isOpen, 
  onClose, 
  searchQuery, 
  onSearch, 
  searchResults, 
  currentResultIndex,
  onNextResult,
  onPrevResult,
  isSearching,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed top-20 right-4 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">Search in document</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Enter search terms..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />
          
          {isSearching && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {!isSearching && searchResults.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      idx === currentResultIndex
                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">Page {result.pageNum}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {result.context}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={onPrevResult}
                  className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Previous
                </button>
                <button
                  onClick={onNextResult}
                  className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {!isSearching && searchQuery && searchResults.length === 0 && (
            <p className="text-center text-gray-500 py-4">No results found for "{searchQuery}"</p>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchBar;