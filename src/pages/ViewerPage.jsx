import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import FileViewer from '../components/FileViewer';
import { logFileViewStart, logFileViewClose } from '../services/loggerService';

function ViewerPage() {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const actualFileId = fileId || searchParams.get('fileId');

  useEffect(() => {
    if (actualFileId) {
      logFileViewStart(actualFileId, 'File Viewer', false, true);
    }
    return () => {
      if (actualFileId) {
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