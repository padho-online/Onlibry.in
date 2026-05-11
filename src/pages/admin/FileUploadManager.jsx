// src/pages/admin/FileUploadManager.jsx
// UPDATED - Single file upload WITH watermark (using pdfUploadService)

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadPDFWithWatermark } from '../../services/pdfUploadService';

// Google Sheet API URL
const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;

function FileUploadManager() {
  const { user } = useAuth();
  const [filesList, setFilesList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Default metadata for all files
  const [defaultMetadata, setDefaultMetadata] = useState({
    price: 29,
    isPremium: true,
    showOnWebsite: true,
    tags: ''
  });

  // Add files to upload queue
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 10),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      metadata: { ...defaultMetadata }
    }));
    
    setFilesList(prev => [...prev, ...newFiles]);
    setMessage({ type: 'info', text: `${newFiles.length} file(s) added to queue` });
  };

  // Remove file from queue
  const removeFile = (fileId) => {
    setFilesList(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // Update metadata for a specific file
  const updateFileMetadata = (fileId, field, value) => {
    setFilesList(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, metadata: { ...file.metadata, [field]: value } }
        : file
    ));
  };

  // Apply default metadata to all files
  const applyDefaultToAll = () => {
    setFilesList(prev => prev.map(file => ({
      ...file,
      metadata: { ...defaultMetadata }
    })));
    setMessage({ type: 'info', text: 'Default metadata applied to all files' });
  };

  // Clear all files from queue
  const clearAllFiles = () => {
    if (filesList.length > 0 && window.confirm(`Clear ${filesList.length} files from queue?`)) {
      setFilesList([]);
      setUploadProgress({});
      setMessage({ type: 'info', text: 'Queue cleared' });
    }
  };

  // Get client IP
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };

  // Send to Google Sheet
  const sendToSheet = async (data) => {
    try {
      await fetch(SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
      });
      return true;
    } catch (error) {
      console.error('Send to sheet error:', error);
      return false;
    }
  };

  // 🔥 Upload single file with watermark
  const uploadSingleFile = async (fileItem) => {
    const result = await uploadPDFWithWatermark(fileItem.file, fileItem.metadata);
    return result;
  };

  // Upload all files
  const handleUploadAll = async () => {
    if (filesList.length === 0) {
      setMessage({ type: 'error', text: 'No files to upload' });
      return;
    }

    setUploading(true);
    const userIp = await getClientIP();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < filesList.length; i++) {
      const fileItem = filesList[i];
      
      setFilesList(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'uploading' } : f
      ));
      setUploadProgress(prev => ({ ...prev, [fileItem.id]: { status: 'uploading', progress: 30 } }));
      
      try {
        // 🔥 Upload to Cloudflare with watermark
        const uploadResult = await uploadSingleFile(fileItem);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
        
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: { status: 'uploading', progress: 70 } }));
        
        // Add to Google Sheet
        const isPremiumValue = fileItem.metadata.isPremium === true;
        const showOnWebsiteValue = fileItem.metadata.showOnWebsite === true;
        
        const sheetData = {
          action: 'add',
          fileId: uploadResult.fileId,
          fileName: fileItem.metadata.name || fileItem.file.name,
          fileSize: fileItem.file.size,
          mimeType: fileItem.file.type,
          price: Number(fileItem.metadata.price) || 29,
          isPremium: isPremiumValue,
          showOnWebsite: showOnWebsiteValue,
          tags: fileItem.metadata.tags || '',
          cloudflareKey: uploadResult.fileId,
          uploadedBy: user?.email,
          uploadedByName: user?.displayName || user?.email?.split('@')[0],
          userIp: userIp,
          userAgent: navigator.userAgent
        };
        
        await sendToSheet(sheetData);
        
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: { status: 'success', progress: 100 } }));
        setFilesList(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'success' } : f
        ));
        
        successCount++;
        
      } catch (error) {
        console.error(`Failed to upload ${fileItem.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: { status: 'failed', error: error.message } }));
        setFilesList(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'failed', error: error.message } : f
        ));
        failCount++;
      }
    }

    setUploading(false);
    setMessage({ type: 'success', text: `Upload complete! ${successCount} succeeded, ${failCount} failed.` });
    
    // Remove successful files after 3 seconds
    setTimeout(() => {
      setFilesList(prev => prev.filter(f => f.status !== 'success'));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        Object.keys(newProgress).forEach(key => {
          if (newProgress[key].status === 'success') {
            delete newProgress[key];
          }
        });
        return newProgress;
      });
    }, 3000);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Get status badge
  const getStatusBadge = (fileItem) => {
    const progress = uploadProgress[fileItem.id];
    
    if (progress?.status === 'success' || fileItem.status === 'success') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✅ Uploaded</span>;
    }
    if (progress?.status === 'failed' || fileItem.status === 'failed') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">❌ Failed</span>;
    }
    if (progress?.status === 'uploading' || fileItem.status === 'uploading') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">⏳ Uploading...</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Pending</span>;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          📤 Multiple Files Upload
        </h2>
        <div className="flex gap-2">
          {filesList.length > 0 && !uploading && (
            <>
              <button
                onClick={applyDefaultToAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Default to All
              </button>
              <button
                onClick={clearAllFiles}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clear All
              </button>
              <button
                onClick={handleUploadAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Upload All ({filesList.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Default Metadata Section */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Default Metadata (applies to all files)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price (₹)</label>
            <input
              type="number"
              value={defaultMetadata.price}
              onChange={(e) => setDefaultMetadata({ ...defaultMetadata, price: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={defaultMetadata.tags}
              onChange={(e) => setDefaultMetadata({ ...defaultMetadata, tags: e.target.value })}
              placeholder="subject:Maths, course:BCA"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={defaultMetadata.isPremium}
                onChange={(e) => setDefaultMetadata({ ...defaultMetadata, isPremium: e.target.checked })}
              />
              Premium
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={defaultMetadata.showOnWebsite}
                onChange={(e) => setDefaultMetadata({ ...defaultMetadata, showOnWebsite: e.target.checked })}
              />
              Show on Website
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
                📁 Select Files
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Files Queue Table */}
      {filesList.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="p-2 text-left">File Name</th>
                <th className="p-2 text-left">Size</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Premium</th>
                <th className="p-2 text-left">Visible</th>
                <th className="p-2 text-left">Tags</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filesList.map((fileItem) => (
                <tr key={fileItem.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2">
                    <div className="truncate max-w-[200px]" title={fileItem.name}>
                      {fileItem.name}
                    </div>
                  </td>
                  <td className="p-2 text-gray-500 text-xs">{formatFileSize(fileItem.size)}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={fileItem.metadata.price}
                      onChange={(e) => updateFileMetadata(fileItem.id, 'price', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      disabled={uploading || fileItem.status === 'success'}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={fileItem.metadata.isPremium === true}
                      onChange={(e) => updateFileMetadata(fileItem.id, 'isPremium', e.target.checked)}
                      className="w-4 h-4"
                      disabled={uploading || fileItem.status === 'success'}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={fileItem.metadata.showOnWebsite === true}
                      onChange={(e) => updateFileMetadata(fileItem.id, 'showOnWebsite', e.target.checked)}
                      className="w-4 h-4"
                      disabled={uploading || fileItem.status === 'success'}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={fileItem.metadata.tags || ''}
                      onChange={(e) => updateFileMetadata(fileItem.id, 'tags', e.target.value)}
                      placeholder="subject:Maths"
                      className="w-32 px-2 py-1 border rounded text-xs"
                      disabled={uploading || fileItem.status === 'success'}
                    />
                  </td>
                  <td className="p-2">
                    {getStatusBadge(fileItem)}
                    {uploadProgress[fileItem.id]?.progress > 0 && uploadProgress[fileItem.id]?.progress < 100 && (
                      <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${uploadProgress[fileItem.id]?.progress || 0}%` }}
                        ></div>
                      </div>
                    )}
                   </td>
                  <td className="p-2">
                    {!uploading && fileItem.status !== 'success' && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ❌
                      </button>
                    )}
                    {fileItem.status === 'success' && (
                      <span className="text-green-500">✓</span>
                    )}
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      )}

      {/* No Files */}
      {filesList.length === 0 && !uploading && (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-gray-500 mb-4">No files selected</p>
          <label className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block">
            Select Files to Upload
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Uploading Status */}
      {uploading && (
        <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading {filesList.filter(f => f.status === 'uploading').length} files...</span>
          </div>
          <div className="mt-2 text-sm">
            Success: {filesList.filter(f => f.status === 'success').length} | 
            Failed: {filesList.filter(f => f.status === 'failed').length} |
            Pending: {filesList.filter(f => f.status === 'pending').length}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploadManager;