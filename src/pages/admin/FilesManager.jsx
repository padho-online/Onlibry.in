import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

// Global variables for Google API
let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;

// Load Google APIs
const loadGoogleApis = () => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API'));
    document.head.appendChild(script);
  });
};

const loadGoogleIdentity = () => {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity'));
    document.head.appendChild(script);
  });
};

function FilesManager() {
  const [files, setFiles] = useState([]);
  const [allDriveFolders, setAllDriveFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('1eK8qYfhKcUh4BAXswW7J-V8OJmPD51Q_');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFolderId, setBulkFolderId] = useState('');
  const [bulkShowOnWeb, setBulkShowOnWeb] = useState(null);
  const [bulkIsPremium, setBulkIsPremium] = useState(null);

  // Initialize Google APIs
  useEffect(() => {
    initializeGoogleApis();
  }, []);

  const initializeGoogleApis = async () => {
    setIsLoadingAuth(true);
    try {
      await loadGoogleApis();
      await loadGoogleIdentity();
      
      // Initialize GAPI client
      await new Promise((resolve) => {
        gapi.load('client', resolve);
      });
      
      await gapi.client.init({
        apiKey: 'AIzaSyC02khoIXw9oG2aVo7m5rGolfdTMM6FLOo',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
      
      gapiInited = true;
      
      // Initialize Token Client
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: '279268985463-013b4esq66rfkuojg1ssrb9t0evsh1e0.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive',
        callback: (resp) => {
          if (resp.error) {
            console.error('Auth error:', resp);
            setIsGoogleAuth(false);
            setIsLoadingAuth(false);
            return;
          }
          accessToken = resp.access_token;
          setIsGoogleAuth(true);
          setIsLoadingAuth(false);
          loadDriveFiles('root');
        },
      });
      
      gisInited = true;
      
      // Check if user is admin first
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
          // Request access token
          tokenClient.requestAccessToken();
        } else {
          setIsLoadingAuth(false);
          alert('Admin access required');
        }
      } else {
        setIsLoadingAuth(false);
        alert('Please login as admin');
      }
      
    } catch (error) {
      console.error('Google API init error:', error);
      setIsLoadingAuth(false);
    }
  };

  // Load folders for dropdown
  const loadFolders = async () => {
    if (!accessToken) return [];
    try {
      const response = await gapi.client.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: "files(id,name,parents)",
        pageSize: 1000
      });
      setAllDriveFolders(response.result.files);
      return response.result.files;
    } catch (error) {
      console.error('Error loading folders:', error);
      return [];
    }
  };

  // Load files from Google Drive
  const loadDriveFiles = async (folderId = 'root') => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const folders = await loadFolders();
      
      let allFiles = [];
      let nextPageToken = null;
      
      do {
        const response = await gapi.client.drive.files.list({
          q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder'`,
          fields: "files(id,name,webViewLink,webContentLink,parents,createdTime,modifiedTime), nextPageToken",
          pageSize: 1000,
          orderBy: 'name',
          pageToken: nextPageToken || undefined
        });
        
        allFiles = allFiles.concat(response.result.files);
        nextPageToken = response.result.nextPageToken;
      } while (nextPageToken);
      
      // Get Firestore metadata for each file
      const filesWithMetadata = [];
      for (const file of allFiles) {
        const docSnap = await getDoc(doc(db, 'files', file.id));
        const fileData = docSnap.exists() ? docSnap.data() : {};
        
        // Get folder name
        const folder = folders.find(f => f.id === (file.parents?.[0] || 'root'));
        
        filesWithMetadata.push({
          id: file.id,
          name: file.name,
          webViewLink: file.webViewLink,
          folderName: folder ? folder.name : 'Root',
          folderId: file.parents?.[0] || 'root',
          ...fileData,
          tags: fileData.tags || {
            university: [],
            course: [],
            year: [],
            semester: [],
            subject: [],
            title: [],
            other: []
          },
          showOnWebsite: fileData.showOnWebsite || false,
          isPremium: fileData.isPremium || false,
          price: fileData.price || 29,
          permissions: fileData.permissions || {
            downloadAllowed: true,
            printAllowed: true,
            copyAllowed: true
          }
        });
      }
      
      setFiles(filesWithMetadata);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle folder change
  const handleFolderChange = (e) => {
    const folderId = e.target.value;
    setSelectedFolder(folderId);
    loadDriveFiles(folderId);
  };

  // Update file metadata in Firestore
  const updateFileMetadata = async (fileId, updates) => {
    try {
      const fileRef = doc(db, 'files', fileId);
      await setDoc(fileRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, ...updates } : file
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating file:', error);
      return false;
    }
  };

  // Update tag value
  const updateTag = async (fileId, tagField, value) => {
    const tags = { ...files.find(f => f.id === fileId)?.tags };
    tags[tagField] = value.split(',').map(t => t.trim()).filter(t => t);
    await updateFileMetadata(fileId, { tags });
  };

  // Toggle show on website
  const toggleShowOnWeb = async (fileId, currentStatus) => {
    await updateFileMetadata(fileId, { showOnWebsite: !currentStatus });
  };

  // Toggle premium status
  const togglePremium = async (fileId, currentStatus) => {
    await updateFileMetadata(fileId, { isPremium: !currentStatus });
  };

  // Update price
  const updatePrice = async (fileId, price) => {
    await updateFileMetadata(fileId, { price: parseInt(price) || 0 });
  };

  // Update file name in Google Drive
  const updateFileName = async (fileId, newName) => {
    try {
      await gapi.client.drive.files.update({
        fileId: fileId,
        resource: { name: newName }
      });
      await updateFileMetadata(fileId, { name: newName });
      return true;
    } catch (error) {
      console.error('Error updating file name:', error);
      return false;
    }
  };

  // Delete file
  const deleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This action cannot be undone.`)) return;
    
    try {
      await gapi.client.drive.files.delete({ fileId: fileId });
      await deleteDoc(doc(db, 'files', fileId));
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file: ' + error.message);
    }
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedFiles.size} files? This cannot be undone.`)) return;
    
    try {
      const batch = writeBatch(db);
      for (const fileId of selectedFiles) {
        await gapi.client.drive.files.delete({ fileId: fileId });
        batch.delete(doc(db, 'files', fileId));
      }
      await batch.commit();
      setSelectedFiles(new Set());
      loadDriveFiles(selectedFolder);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('Error deleting files: ' + error.message);
    }
  };

  // Bulk move
  const bulkMove = async () => {
    if (!bulkFolderId) return;
    
    try {
      for (const fileId of selectedFiles) {
        await gapi.client.drive.files.update({
          fileId: fileId,
          addParents: bulkFolderId,
          removeParents: 'root',
          fields: 'id,parents'
        });
      }
      setShowBulkModal(false);
      setSelectedFiles(new Set());
      loadDriveFiles(selectedFolder);
    } catch (error) {
      console.error('Error moving files:', error);
      alert('Error moving files: ' + error.message);
    }
  };

  // Bulk update
  const bulkUpdate = async () => {
    try {
      const updates = {};
      if (bulkShowOnWeb !== null) updates.showOnWebsite = bulkShowOnWeb;
      if (bulkIsPremium !== null) updates.isPremium = bulkIsPremium;
      
      const batch = writeBatch(db);
      for (const fileId of selectedFiles) {
        batch.set(doc(db, 'files', fileId), updates, { merge: true });
      }
      await batch.commit();
      setShowBulkModal(false);
      setSelectedFiles(new Set());
      loadDriveFiles(selectedFolder);
    } catch (error) {
      console.error('Error in bulk update:', error);
      alert('Error updating files: ' + error.message);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // Select all
  const selectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  // Filter files
  const filteredFiles = files.filter(file =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get folder path
  const getFolderPath = (folder) => {
    if (!folder.parents || folder.parents[0] === 'root') return folder.name;
    const parent = allDriveFolders.find(f => f.id === folder.parents[0]);
    return parent ? `${getFolderPath(parent)} > ${folder.name}` : folder.name;
  };

  // Render tag input
  const renderTagInput = (file, tagField) => {
    const value = file.tags?.[tagField]?.join(', ') || '';
    return (
      <input
        type="text"
        defaultValue={value}
        onBlur={(e) => updateTag(file.id, tagField, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder={`${tagField}s (comma separated)`}
      />
    );
  };

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Connecting to Google Drive...</p>
      </div>
    );
  }

  if (!isGoogleAuth) {
    return (
      <div className="text-center py-20">
        <div className="text-yellow-500 text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold mb-2">Google Drive Access Required</h2>
        <p className="text-gray-500 mb-4">Please authenticate with Google Drive to manage files.</p>
        <button
          onClick={() => tokenClient?.requestAccessToken()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Connect Google Drive
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Google Drive Files Manager
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => loadDriveFiles(selectedFolder)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={selectedFiles.size === 0}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Bulk Edit ({selectedFiles.size})
          </button>
          {selectedFiles.size > 0 && (
            <button
              onClick={bulkDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Delete Selected
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="md:w-64">
          <select
            value={selectedFolder}
            onChange={handleFolderChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="root">Root Folder</option>
            {allDriveFolders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {getFolderPath(folder)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{files.length}</div>
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
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-600">
            ₹{files.filter(f => f.isPremium).reduce((sum, f) => sum + (f.price || 0), 0)}
          </div>
          <div className="text-xs text-gray-500">Total Value</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-600">{selectedFiles.size}</div>
          <div className="text-xs text-gray-500">Selected</div>
        </div>
      </div>

      {/* Files Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="p-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={selectAllFiles}
                    className="w-4 h-4"
                  />
                </th>
                <th className="p-2 text-left">File Name</th>
                <th className="p-2 text-left">Folder</th>
                <th className="p-2 text-left">University</th>
                <th className="p-2 text-left">Course</th>
                <th className="p-2 text-left">Year</th>
                <th className="p-2 text-left">Semester</th>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Other Tags</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Premium</th>
                <th className="p-2 text-left">Visible</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => (
                <tr key={file.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      defaultValue={file.name}
                      onBlur={(e) => updateFileName(file.id, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white dark:bg-gray-700"
                    />
                    <div className="text-xs text-gray-400 mt-1">{file.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="p-2 text-gray-600 dark:text-gray-400 text-sm">{file.folderName}</td>
                  <td className="p-2">{renderTagInput(file, 'university')}</td>
                  <td className="p-2">{renderTagInput(file, 'course')}</td>
                  <td className="p-2">{renderTagInput(file, 'year')}</td>
                  <td className="p-2">{renderTagInput(file, 'semester')}</td>
                  <td className="p-2">{renderTagInput(file, 'subject')}</td>
                  <td className="p-2">{renderTagInput(file, 'title')}</td>
                  <td className="p-2">{renderTagInput(file, 'other')}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={file.price}
                      onChange={(e) => updatePrice(file.id, e.target.value)}
                      min="0"
                      max="999"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-white dark:bg-gray-700"
                      disabled={!file.isPremium}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => togglePremium(file.id, file.isPremium)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        file.isPremium 
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {file.isPremium ? 'Premium' : 'Free'}
                    </button>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleShowOnWeb(file.id, file.showOnWebsite)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        file.showOnWebsite 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {file.showOnWebsite ? 'Visible' : 'Hidden'}
                    </button>
                   </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                        View
                      </a>
                      <button onClick={() => deleteFile(file.id, file.name)} className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No files found in this folder
            </div>
          )}
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Bulk Edit ({selectedFiles.size} files)</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Move to Folder</label>
                <select
                  value={bulkFolderId}
                  onChange={(e) => setBulkFolderId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Don't Move --</option>
                  {allDriveFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {getFolderPath(folder)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Set Visibility</label>
                <select
                  value={bulkShowOnWeb === null ? '' : bulkShowOnWeb}
                  onChange={(e) => setBulkShowOnWeb(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- No Change --</option>
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Set Premium Status</label>
                <select
                  value={bulkIsPremium === null ? '' : bulkIsPremium}
                  onChange={(e) => setBulkIsPremium(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- No Change --</option>
                  <option value="true">Premium</option>
                  <option value="false">Free</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={bulkMove}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Move Files
              </button>
              <button
                onClick={bulkUpdate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesManager;