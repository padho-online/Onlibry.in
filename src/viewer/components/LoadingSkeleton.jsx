// src/viewer/components/LoadingSkeleton.jsx
import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-green-600 dark:text-green-400">PDF</span>
        </div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading document...</p>
    </div>
  );
};

export default LoadingSkeleton;