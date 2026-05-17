// src/pages/admin/FilesManager.jsx
// FULLY FIXED - Bulk Update working with GET requests (No CORS issues)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Cloudflare Worker Config
const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
const ADMIN_SECRET_KEY = import.meta.env.VITE_CLOUDFLARE_ADMIN_KEY || 'Habibul@812922112';

// Google Sheet API URL
const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;

function FilesManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 29,
    isPremium: true,
    showOnWebsite: true,
    tags: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load ALL files from Google Sheet
  const loadFiles = async () => {
    setLoading(true);
    try {
      console.log('📡 Loading ALL files from sheet...');
      const response = await fetch(`${SHEET_API_URL}?admin=true&t=${Date.now()}`);
      const data = await response.json();
      
      console.log('✅ Raw data received:', data);
      
      if (data.success && data.files) {
        const allFiles = data.files.map(file => ({
          ...file,
          id: file.cloudflareKey || file.id,
          downloadUrl: `${WORKER_URL}/${encodeURIComponent(file.cloudflareKey || file.id)}`,
          viewerUrl: `${WORKER_URL}/view/${encodeURIComponent(file.cloudflareKey || file.id)}`
        }));
        console.log(`📊 Loaded ${allFiles.length} files`);
        setFiles(allFiles);
      } else {
        console.log('⚠️ No files found or API issue');
        setFiles([]);
      }
    } catch (error) {
      console.error('❌ Error loading files:', error);
      setMessage({ type: 'error', text: 'Failed to load files: ' + error.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Convert tags to string
  const tagsToString = (tags, tagsString) => {
    if (tagsString && typeof tagsString === 'string' && tagsString !== '') {
      return tagsString;
    }
    if (typeof tags === 'string' && tags !== '') {
      return tags;
    }
    if (tags && typeof tags === 'object') {
      const parts = [];
      for (const [key, values] of Object.entries(tags)) {
        if (values && Array.isArray(values) && values.length > 0) {
          parts.push(`${key}:${values.join(',')}`);
        } else if (values && typeof values === 'string') {
          parts.push(`${key}:${values}`);
        }
      }
      return parts.join(', ');
    }
    return '';
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

  // Send to Sheet using GET request (No CORS issues)
  const sendToSheetGet = async (params) => {
    try {
      const urlParams = new URLSearchParams(params);
      const response = await fetch(`${SHEET_API_URL}?${urlParams.toString()}&t=${Date.now()}`);
      const result = await response.json();
      console.log(`📥 Response for ${params.action}:`, result);
      return result;
    } catch (error) {
      console.error('Send to sheet error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get Editor Data from Sheet
  const getEditorData = async () => {
    try {
      console.log('📡 Fetching editor data from sheet...');
      const response = await fetch(`${SHEET_API_URL}?action=getEditorData&t=${Date.now()}`);
      const data = await response.json();
      console.log('📊 Editor data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching editor data:', error);
      return { success: false, files: [], error: error.message };
    }
  };

  // Delete from Cloudflare R2
  const deleteFromCloudflare = async (fileId) => {
    if (!fileId) return false;
    
    try {
      console.log(`🗑️ Deleting from Cloudflare R2: ${fileId}`);
      const response = await fetch(`${WORKER_URL}/delete/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': ADMIN_SECRET_KEY }
      });
      const result = await response.json();
      console.log(`Delete response:`, result);
      return result.success === true;
    } catch (error) {
      console.error('Cloudflare delete error:', error);
      return false;
    }
  };

  // BULK UPDATE - Handle both UPDATE and DELETE from Editor sheet
const handleBulkUpdateFromSheet = async () => {
  if (!window.confirm('This will update/delete ALL files from "Editor" sheet. Continue?')) return;
  
  setBulkUpdating(true);
  setMessage({ type: 'info', text: '🔄 Reading Editor sheet...' });
  
  try {
    const userIp = await getClientIP();
    
    // Get editor data using GET
    const editorData = await getEditorData();
    
    console.log('📊 Full editor data:', editorData);
    
    if (!editorData.success) {
      throw new Error(editorData.error || 'Failed to read Editor sheet');
    }
    
    const rows = editorData.files || [];
    console.log(`📋 Total rows in editor: ${rows.length}`);
    
    if (rows.length === 0) {
      setMessage({ type: 'info', text: '📭 No data found in Editor sheet.' });
      setBulkUpdating(false);
      return;
    }
    
    let updated = 0;
    let deleted = 0;
    let failed = 0;
    let skipped = 0;
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // 🔥 Find fileId (case-insensitive)
      const fileId = row.fileId || row.fileid || row.FileId;
      
      if (!fileId || fileId === '' || fileId === 'fileId') {
        console.log(`⚠️ Row ${i + 1}: No fileId found, skipping:`, row);
        skipped++;
        continue;
      }
      
      const status = (row.status || '').toLowerCase();
      console.log(`📝 Row ${i + 1}: Processing ${fileId}, status: ${status || 'update'}`);
      
      // DELETE operation
      if (status === 'deleted') {
        console.log(`🗑️ Deleting file: ${fileId}`);
        const cloudflareDeleted = await deleteFromCloudflare(fileId);
        
        if (cloudflareDeleted) {
          const result = await sendToSheetGet({
            action: 'delete',
            fileId: fileId,
            fileName: row.fileName || 'Unknown',
            deletedBy: user?.email || 'admin',
            deletedByName: user?.displayName || 'Admin',
            userIp: userIp,
            userAgent: navigator.userAgent,
            reason: 'Bulk delete from Editor sheet'
          });
          
          if (result.success) {
            deleted++;
            console.log(`✅ Deleted: ${fileId}`);
          } else {
            failed++;
            console.log(`❌ Delete failed: ${fileId}`, result);
          }
        } else {
          failed++;
          console.log(`❌ Cloudflare delete failed: ${fileId}`);
        }
      }
      // UPDATE operation
      else {
        // Convert boolean values
        let isPremiumVal = false;
        const premiumStr = String(row.isPremium || '').toLowerCase();
        if (premiumStr === 'true' || premiumStr === 'yes' || premiumStr === '1') {
          isPremiumVal = true;
        }
        
        let showOnWebsiteVal = true;
        const showStr = String(row.showOnWebsite || '').toLowerCase();
        if (showStr === 'false' || showStr === 'no' || showStr === '0') {
          showOnWebsiteVal = false;
        }
        
        let priceVal = 29;
        if (row.price && !isNaN(parseInt(row.price))) {
          priceVal = parseInt(row.price);
        }
        
        console.log(`📝 Updating file: ${fileId}, Name: ${row.fileName}, Price: ${priceVal}, Premium: ${isPremiumVal}, Visible: ${showOnWebsiteVal}`);
        
        const result = await sendToSheetGet({
          action: 'update',
          fileId: fileId,
          fileName: row.fileName || '',
          price: priceVal,
          isPremium: isPremiumVal ? 'true' : 'false',
          showOnWebsite: showOnWebsiteVal ? 'true' : 'false',
          tags: row.tags || '',
          updatedBy: user?.email || 'admin',
          updatedByName: user?.displayName || 'Admin',
          userIp: userIp,
          userAgent: navigator.userAgent
        });
        
        if (result.success) {
          updated++;
          console.log(`✅ Updated: ${fileId}`);
        } else {
          failed++;
          console.log(`❌ Update failed: ${fileId}`, result);
        }
      }
    }
    
    // Clear the editor sheet after processing
    console.log('🧹 Clearing Editor sheet...');
    await sendToSheetGet({ action: 'clearEditor' });
    
    let resultText = '';
    if (updated > 0) resultText += `✅ Updated: ${updated} files. `;
    if (deleted > 0) resultText += `🗑️ Deleted: ${deleted} files. `;
    if (skipped > 0) resultText += `⚠️ Skipped: ${skipped} (no fileId). `;
    if (failed > 0) resultText += `❌ Failed: ${failed}. `;
    
    if (updated === 0 && deleted === 0 && skipped === 0 && failed === 0) {
      resultText = '📭 No changes were made. Make sure Editor sheet has data with fileId column.';
    } else {
      resultText += ' Refreshing files...';
    }
    
    setMessage({ type: 'success', text: resultText });
    setTimeout(() => loadFiles(), 2000);
    
  } catch (error) {
    console.error('Bulk update error:', error);
    setMessage({ type: 'error', text: '❌ Bulk update failed: ' + error.message });
  } finally {
    setBulkUpdating(false);
  }
};

  // Clear Editor sheet
  const handleClearEditorSheet = async () => {
    if (!window.confirm('Clear all rows from "Editor" sheet? (Headers will remain)')) return;
    
    setMessage({ type: 'info', text: '🔄 Clearing Editor sheet...' });
    try {
      const result = await sendToSheetGet({ action: 'clearEditor' });
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Editor sheet cleared!' });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to clear Editor sheet: ' + (result.error || 'Unknown error') });
      }
    } catch (error) {
      console.error('Clear editor error:', error);
      setMessage({ type: 'error', text: '❌ Failed to clear Editor sheet: ' + error.message });
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage({ type: 'info', text: 'Uploading to Cloudflare...' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fileName', editForm.name || selectedFile.name);

      const uploadRes = await fetch(`${WORKER_URL}/upload`, {
        method: 'POST',
        headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
        body: formData
      });

      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      const userIp = await getClientIP();
      
      await sendToSheetGet({
        action: 'add',
        fileId: uploadResult.fileId,
        fileName: editForm.name || selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        price: editForm.price,
        isPremium: editForm.isPremium ? 'true' : 'false',
        showOnWebsite: editForm.showOnWebsite ? 'true' : 'false',
        tags: editForm.tags || '',
        cloudflareKey: uploadResult.fileId,
        uploadedBy: user?.email || 'admin',
        uploadedByName: user?.displayName || 'Admin',
        userIp: userIp,
        userAgent: navigator.userAgent
      });
      
      setMessage({ type: 'success', text: '✅ File uploaded successfully!' });
      
      setSelectedFile(null);
      setEditForm({ name: '', price: 29, isPremium: true, showOnWebsite: true, tags: '' });
      setShowUploadModal(false);
      loadFiles();
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: '❌ Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  // Update file metadata
  const handleUpdateFile = async (file) => {
    setMessage({ type: 'info', text: 'Updating file metadata...' });

    try {
      const userIp = await getClientIP();
      
      await sendToSheetGet({
        action: 'update',
        fileId: file.cloudflareKey || file.id,
        fileName: editForm.name,
        price: editForm.price,
        isPremium: editForm.isPremium ? 'true' : 'false',
        showOnWebsite: editForm.showOnWebsite ? 'true' : 'false',
        tags: editForm.tags,
        updatedBy: user?.email || 'admin',
        updatedByName: user?.displayName || 'Admin',
        userIp: userIp,
        userAgent: navigator.userAgent
      });
      
      setMessage({ type: 'success', text: '✅ File updated successfully!' });
      setEditingFile(null);
      loadFiles();
      
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: '❌ Update failed: ' + error.message });
    }
  };

  // Delete file manually
  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Delete "${file.name}" permanently from Cloudflare and Sheet?`)) return;

    setMessage({ type: 'info', text: 'Deleting file...' });

    try {
      const fileId = file.cloudflareKey || file.id;
      
      const deleted = await deleteFromCloudflare(fileId);
      
      if (deleted) {
        const userIp = await getClientIP();
        
        await sendToSheetGet({
          action: 'delete',
          fileId: fileId,
          fileName: file.name,
          deletedBy: user?.email || 'admin',
          deletedByName: user?.displayName || 'Admin',
          userIp: userIp,
          userAgent: navigator.userAgent,
          reason: 'Manual delete from admin panel'
        });
        
        setMessage({ type: 'success', text: '✅ File deleted successfully!' });
        loadFiles();
      } else {
        setMessage({ type: 'error', text: '❌ Failed to delete from Cloudflare.' });
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: '❌ Delete failed: ' + error.message });
    }
  };

  const getFileUrl = (file) => {
    const key = file.cloudflareKey || file.id;
    return `${WORKER_URL}/${encodeURIComponent(key)}`;
  };

  const filteredFiles = files.filter(file =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          📁 Files Manager
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Upload New File
          </button>
          <button
            onClick={handleBulkUpdateFromSheet}
            disabled={bulkUpdating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {bulkUpdating ? '⏳ Updating...' : '📥 Bulk Update from Sheet'}
          </button>
          <button
            onClick={handleClearEditorSheet}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            🗑️ Clear Editor Sheet
          </button>
          <button
            onClick={loadFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-600">{files.length}</div>
          <div className="text-xs text-gray-500">Total Files</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{files.filter(f => f.showOnWebsite).length}</div>
          <div className="text-xs text-gray-500">Visible</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{files.filter(f => f.isPremium).length}</div>
          <div className="text-xs text-gray-500">Premium</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-600">{files.filter(f => !f.showOnWebsite).length}</div>
          <div className="text-xs text-gray-500">Hidden</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search files by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
      </div>

      {/* Files Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
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
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  {editingFile === file.id ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="p-2 text-gray-500 text-xs">
                        {(file.size / 1024).toFixed(2)} KB
                       </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border rounded"
                        />
                       </td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={editForm.isPremium}
                          onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.checked })}
                          className="w-4 h-4"
                        />
                       </td>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={editForm.showOnWebsite}
                          onChange={(e) => setEditForm({ ...editForm, showOnWebsite: e.target.checked })}
                          className="w-4 h-4"
                        />
                       </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          placeholder="subject:Maths"
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                       </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleUpdateFile(file)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs mr-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFile(null)}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
                        >
                          Cancel
                        </button>
                       </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">
                        <a 
                          href={getFileUrl(file)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {file.name}
                        </a>
                        <div className="text-xs text-gray-400 font-mono mt-1">
                          {file.cloudflareKey?.slice(0, 30)}...
                        </div>
                        {!file.showOnWebsite && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Hidden</span>
                        )}
                       </td>
                      <td className="p-2 text-gray-500 text-xs">
                        {(file.size / 1024).toFixed(2)} KB
                       </td>
                      <td className="p-2 font-medium">₹{file.price || 29}</td>
                      <td className="p-2">
                        {file.isPremium ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Premium</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Free</span>
                        )}
                       </td>
                      <td className="p-2">
                        {file.showOnWebsite ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Visible</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Hidden</span>
                        )}
                       </td>
                      <td className="p-2 text-xs text-gray-500 max-w-[250px]">
                        {(() => {
                          const displayTags = tagsToString(file.tags, file.tagsString);
                          return displayTags ? (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs break-words">
                              {displayTags}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          );
                        })()}
                       </td>
                      <td className="p-2">
                        <button
                          onClick={() => {
                            setEditingFile(file.id);
                            setEditForm({
                              name: file.name || '',
                              price: file.price || 29,
                              isPremium: file.isPremium || false,
                              showOnWebsite: file.showOnWebsite !== false,
                              tags: tagsToString(file.tags, file.tagsString)
                            });
                          }}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs mr-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        >
                          Delete
                        </button>
                       </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No files found. Click "Upload New File" to add files.
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Upload New File</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select File:</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Name:</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="File display name"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price (₹):</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags:</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="subject:Maths, course:BCA"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.isPremium}
                    onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.checked })}
                  />
                  Premium File
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.showOnWebsite}
                    onChange={(e) => setEditForm({ ...editForm, showOnWebsite: e.target.checked })}
                  />
                  Show on Website
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : '⬆️ Upload to Cloudflare'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesManager;