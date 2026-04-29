import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const GOOGLE_CLIENT_ID = '279268985463-013b4esq66rfkuojg1ssrb9t0evsh1e0.apps.googleusercontent.com';

function FilesManager() {
  const [files, setFiles] = useState([]);
  const [allDriveFolders, setAllDriveFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [accessToken, setAccessToken] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);
  
  // Pagination state
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalFileCount, setTotalFileCount] = useState(0);

  // Check admin on mount
  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please login as admin first');
      return;
    }
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || !userDoc.data().isAdmin) {
      alert('Admin access required');
      return;
    }
    
    await loadGoogleScripts();
  };

  const loadGoogleScripts = () => {
    return new Promise((resolve) => {
      if (window.gapi && window.google) {
        initTokenClient();
        resolve();
        return;
      }
      
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = () => {
          initTokenClient();
          resolve();
        };
        document.head.appendChild(gisScript);
      };
      document.head.appendChild(gapiScript);
    });
  };

  const initTokenClient = () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
      callback: async (resp) => {
        if (resp.error) {
          console.error('Auth error:', resp);
          setIsGoogleAuth(false);
          setIsLoadingAuth(false);
          return;
        }
        setAccessToken(resp.access_token);
        setIsGoogleAuth(true);
        setIsLoadingAuth(false);
        await loadDriveFiles('root', resp.access_token, false);
      },
    });
    setTokenClient(client);
  };

  const authenticate = () => {
    setIsLoadingAuth(true);
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      initTokenClient();
      tokenClient?.requestAccessToken();
    }
  };

  // Load Drive Files with Pagination Support
  const loadDriveFiles = async (folderId = 'root', token = accessToken, loadMore = false) => {
    if (!token) return;
    
    if (!loadMore) {
      setLoading(true);
      setFiles([]);
      setNextPageToken(null);
      setHasMore(false);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // First, get total count and folders
      const foldersResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,parents)&pageSize=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const foldersData = await foldersResponse.json();
      const folders = foldersData.files || [];
      setAllDriveFolders(folders);
      
      // Build URL with pagination
      let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,webViewLink,parents,createdTime,modifiedTime),nextPageToken&pageSize=200&orderBy=name`;
      
      if (loadMore && nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }
      
      const filesResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filesData = await filesResponse.json();
      const driveFiles = filesData.files || [];
      const newNextPageToken = filesData.nextPageToken || null;
      
      setNextPageToken(newNextPageToken);
      setHasMore(!!newNextPageToken);
      
      // Get Firestore metadata for each file
      const filesWithMeta = [];
      for (const file of driveFiles) {
        const docSnap = await getDoc(doc(db, 'files', file.id));
        const fileData = docSnap.exists() ? docSnap.data() : {};
        const folder = folders.find(f => f.id === (file.parents?.[0]));
        
        filesWithMeta.push({
          id: file.id,
          name: file.name,
          webViewLink: file.webViewLink,
          folderName: folder ? folder.name : 'Root',
          ...fileData,
          tags: fileData.tags || { 
            university: [], course: [], year: [], semester: [], 
            subject: [], title: [], other: [] 
          },
          showOnWebsite: fileData.showOnWebsite || false,
          isPremium: fileData.isPremium || false,
          price: fileData.price || 29,
        });
      }
      
      if (loadMore) {
        setFiles(prev => [...prev, ...filesWithMeta]);
      } else {
        setFiles(filesWithMeta);
      }
      
      setTotalFileCount(prev => loadMore ? prev + driveFiles.length : driveFiles.length);
      
    } catch (error) {
      console.error('Error loading files:', error);
      if (error.status === 401) {
        setIsGoogleAuth(false);
        alert('Session expired. Please reconnect.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load ALL files recursively (for full export)
  const loadAllFilesRecursively = async (folderId = 'root', token = accessToken) => {
    if (!token) return [];
    
    let allFiles = [];
    let pageToken = null;
    let hasMorePages = true;
    
    try {
      while (hasMorePages) {
        let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,webViewLink,parents,createdTime,modifiedTime),nextPageToken&pageSize=200&orderBy=name`;
        
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        const driveFiles = data.files || [];
        
        allFiles = [...allFiles, ...driveFiles];
        pageToken = data.nextPageToken;
        hasMorePages = !!pageToken;
      }
      
      return allFiles;
    } catch (error) {
      console.error('Error loading all files:', error);
      return allFiles;
    }
  };

  const updateFileMetadata = async (fileId, updates) => {
    try {
      await setDoc(doc(db, 'files', fileId), { ...updates, lastUpdated: serverTimestamp() }, { merge: true });
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates } : f));
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const updateTag = async (fileId, tagField, value) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    const tags = { ...file.tags };
    tags[tagField] = value.split(',').map(t => t.trim()).filter(t => t);
    await updateFileMetadata(fileId, { tags });
  };

  const renderTagInput = (file, tagField) => {
    const value = file.tags?.[tagField]?.join(', ') || '';
    return (
      <input
        type="text"
        defaultValue={value}
        onBlur={(e) => updateTag(file.id, tagField, e.target.value)}
        className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-700"
        placeholder={`${tagField}s (comma separated)`}
      />
    );
  };

  const handleFolderChange = async (e) => {
    const folderId = e.target.value;
    setSelectedFolder(folderId);
    setNextPageToken(null);
    setHasMore(false);
    await loadDriveFiles(folderId, accessToken, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadDriveFiles(selectedFolder, accessToken, true);
    }
  };

  const handleExportAll = async () => {
    if (!accessToken) return;
    setLoading(true);
    const allFiles = await loadAllFilesRecursively(selectedFolder, accessToken);
    alert(`Total files in this folder: ${allFiles.length}`);
    console.log('All files:', allFiles);
    setLoading(false);
  };

  const toggleFileSelection = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === files.length && files.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const filteredFiles = files.filter(file =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingAuth) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Connecting to Google Drive...</p>
      </div>
    );
  }

  if (!isGoogleAuth) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold mb-2">Google Drive Access Required</h2>
        <p className="text-gray-500 mb-4">Click below to connect your Google Drive account.</p>
        <button
          onClick={authenticate}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Connect Google Drive
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-bold">Google Drive Files Manager</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExportAll}
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
            title="Count all files in folder"
          >
            Count All
          </button>
          <button 
            onClick={() => loadDriveFiles(selectedFolder, accessToken, false)} 
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select 
          value={selectedFolder} 
          onChange={handleFolderChange} 
          className="px-4 py-2 border rounded-lg w-64"
        >
          <option value="root">Root Folder</option>
          {allDriveFolders.map(folder => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{files.length}</div>
          <div className="text-xs">Displayed</div>
        </div>
        <div className="bg-green-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{files.filter(f => f.showOnWebsite).length}</div>
          <div className="text-xs">Visible</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{files.filter(f => f.isPremium).length}</div>
          <div className="text-xs">Premium</div>
        </div>
        <div className="bg-purple-100 p-3 rounded text-center">
          <div className="text-xl font-bold">₹{files.reduce((s, f) => s + (f.isPremium ? f.price : 0), 0)}</div>
          <div className="text-xs">Value</div>
        </div>
        <div className="bg-red-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{selectedFiles.size}</div>
          <div className="text-xs">Selected</div>
        </div>
      </div>

      {/* Files Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 w-10">
                    <input type="checkbox" checked={selectedFiles.size === files.length && files.length > 0} onChange={selectAllFiles} />
                  </th>
                  <th className="p-2">File Name</th>
                  <th className="p-2">Folder</th>
                  <th className="p-2">University</th>
                  <th className="p-2">Course</th>
                  <th className="p-2">Year</th>
                  <th className="p-2">Semester</th>
                  <th className="p-2">Subject</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Other Tags</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Premium</th>
                  <th className="p-2">Visible</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input type="checkbox" checked={selectedFiles.has(file.id)} onChange={() => toggleFileSelection(file.id)} />
                    </td>
                    <td className="p-2">
                      <input type="text" defaultValue={file.name} onBlur={(e) => updateFileMetadata(file.id, { name: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
                      <div className="text-xs text-gray-400 mt-1">{file.id?.slice(0, 8)}...</div>
                    </td>
                    <td className="p-2 text-sm">{file.folderName}</td>
                    <td className="p-2">{renderTagInput(file, 'university')}</td>
                    <td className="p-2">{renderTagInput(file, 'course')}</td>
                    <td className="p-2">{renderTagInput(file, 'year')}</td>
                    <td className="p-2">{renderTagInput(file, 'semester')}</td>
                    <td className="p-2">{renderTagInput(file, 'subject')}</td>
                    <td className="p-2">{renderTagInput(file, 'title')}</td>
                    <td className="p-2">{renderTagInput(file, 'other')}</td>
                    <td className="p-2">
                      <input type="number" value={file.price} onChange={(e) => updateFileMetadata(file.id, { price: parseInt(e.target.value) || 0 })} min="0" max="999" className="w-20 px-2 py-1 text-sm border rounded" disabled={!file.isPremium} />
                    </td>
                    <td className="p-2">
                      <button onClick={() => updateFileMetadata(file.id, { isPremium: !file.isPremium })} className={`px-2 py-1 rounded text-xs font-medium ${file.isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {file.isPremium ? 'Premium' : 'Free'}
                      </button>
                    </td>
                    <td className="p-2">
                      <button onClick={() => updateFileMetadata(file.id, { showOnWebsite: !file.showOnWebsite })} className={`px-2 py-1 rounded text-xs font-medium ${file.showOnWebsite ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {file.showOnWebsite ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-2">
                      <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mr-2">View</a>
                      <button onClick={() => { if(confirm('Delete this file?')) deleteDoc(doc(db, 'files', file.id)).then(() => setFiles(files.filter(f => f.id !== file.id))); }} className="text-red-600 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredFiles.length === 0 && (
              <div className="text-center py-12 text-gray-500">No files found in this folder</div>
            )}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-4">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Files'}
              </button>
            </div>
          )}
          
          {/* Show total count if more files exist */}
          {hasMore && (
            <div className="text-center mt-2 text-xs text-gray-500">
              Showing {files.length} files. Click "Load More" to see more.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FilesManager;