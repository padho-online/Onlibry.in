// src/blogger/hooks/useAutoSave.js

import { useEffect, useRef } from 'react';

export function useAutoSave(data, onSave, interval = 5000) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const autoSave = () => {
      if (dataRef.current && lastSavedRef.current !== JSON.stringify(dataRef.current)) {
        onSave(dataRef.current);
        lastSavedRef.current = JSON.stringify(dataRef.current);
      }
    };

    timeoutRef.current = setInterval(autoSave, interval);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [onSave, interval]);
}