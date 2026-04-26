import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FileViewer from '../components/FileViewer';

function ViewerPage() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Support both /viewer/:fileId and /viewer?fileId=xxx
  const actualFileId = fileId || searchParams.get('fileId');
  
  if (!actualFileId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-red-600">No file specified</h2>
        <button onClick={() => window.history.back()} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">
          Go Back
        </button>
      </div>
    );
  }
  
  return <FileViewer />;
}

export default ViewerPage;