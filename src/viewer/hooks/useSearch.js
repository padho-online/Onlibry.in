// src/viewer/hooks/useSearch.js
import { useState, useCallback, useRef } from 'react';

export function useSearch(pdfDoc) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const getContextAroundText = (text, searchTerm, contextLength = 50) => {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return '';
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + searchTerm.length + contextLength);
    let context = text.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    return context;
  };

  const performSearch = useCallback(async (query) => {
    if (!pdfDoc || !query || query.length < 2) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = [];
      const searchTerm = query.toLowerCase();
      
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        if (pageText.toLowerCase().includes(searchTerm)) {
          const positions = [];
          let index = pageText.toLowerCase().indexOf(searchTerm);
          while (index !== -1) {
            positions.push({ start: index, end: index + searchTerm.length });
            index = pageText.toLowerCase().indexOf(searchTerm, index + 1);
          }
          
          results.push({
            pageNum: i,
            text: pageText,
            positions,
            context: getContextAroundText(pageText, searchTerm),
          });
        }
        
        page.cleanup();
      }
      
      setSearchResults(results);
      setCurrentResultIndex(results.length > 0 ? 0 : -1);
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [pdfDoc]);

  const debouncedSearch = useCallback((query) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    setSearchQuery(query);
    searchTimeout.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(prev => (prev + 1) % searchResults.length);
  }, [searchResults.length]);

  const goToPrevResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults.length]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  }, []);

  return {
    searchQuery,
    searchResults,
    currentResultIndex,
    isSearching,
    debouncedSearch,
    goToNextResult,
    goToPrevResult,
    clearSearch,
    currentResult: searchResults[currentResultIndex],
  };
}

// export { useSearch };