// src/components/SecurePDFViewer.jsx
import React from 'react';
import { PdfViewer } from '../viewer';

const SecurePDFViewer = ({
  fileUrl,
  fileName,
  showDownloadButton = false,
  onDownload,
  isPremium = false,
  isSubscribed = false,
  userEmail = null,
  onClose,
}) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 text-white p-2 flex justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-sm"
        >
          ✕ Close
        </button>
      </div>
      
      <div className="flex-1">
        <PdfViewer
          pdfUrl={fileUrl}
          fileName={fileName}
          isSubscribed={isSubscribed}
          isPreviewMode={!isSubscribed && isPremium}
          previewLimit={3}
          userEmail={userEmail}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
};

export default SecurePDFViewer;