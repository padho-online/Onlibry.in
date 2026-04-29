import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FileViewer from '../components/FileViewer';
import { logFileViewStart, logFileViewClose } from '../services/loggerService';

function ViewerPage() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Support both /viewer/:fileId and /viewer?fileId=xxx
  const actualFileId = fileId || searchParams.get('fileId');
  
  // Log file view start when component mounts
  useEffect(() => {
    if (actualFileId) {
      console.log('📊 Logging file view start for:', actualFileId);
      // Log file view start
      logFileViewStart(actualFileId, 'File Viewer', false, true);
    }
    
    // Log file view close when component unmounts
    return () => {
      if (actualFileId) {
        console.log('📊 Logging file view close for:', actualFileId);
        logFileViewClose();
      }
    };
  }, [actualFileId]);
  
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