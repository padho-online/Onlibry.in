// src/viewer/hooks/usePdfDocument.js
import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 🔥 Worker is set ONLY here
const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

console.log('✅ PDF.js worker initialized:', pdfjsLib.GlobalWorkerOptions.workerSrc);

export function usePdfDocument(pdfUrl, options = {}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const loadingRef = useRef(false);

  const loadDocument = useCallback(async () => {
    if (!pdfUrl || loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Loading PDF from:', pdfUrl);
      
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
        cMapPacked: true,
        withCredentials: options.withCredentials || false,
        httpHeaders: options.headers || {},
      });
      
      const doc = await loadingTask.promise;
      console.log('✅ PDF loaded, pages:', doc.numPages);
      
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      
      try {
        const metadata = await doc.getMetadata();
        setMetadata(metadata.info);
      } catch (err) {
        console.warn('Could not load metadata:', err);
      }
      
    } catch (err) {
      console.error('❌ Failed to load PDF:', err);
      setError(err.message || 'Failed to load PDF document');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [pdfUrl, options]);

  useEffect(() => {
    loadDocument();
    
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [loadDocument]);

  return { pdfDoc, numPages, loading, error, metadata };
}