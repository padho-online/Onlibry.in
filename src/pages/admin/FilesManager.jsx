import React, { useState, useEffect } from 'react';
import { db, auth } from '../../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

let tokenClient = null;
let accessToken = null;

function FilesManager() {
  const [files, setFiles] = useState([]);
  const [allDriveFolders, setAllDriveFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFolderId, setBulkFolderId] = useState('');
  const [bulkShowOnWeb, setBulkShowOnWeb] = useState(null);
  const [bulkIsPremium, setBulkIsPremium] = useState(null);

  // Load Google APIs
  useEffect(() => {
    const loadApis = async () => {
      setIsLoadingAuth(true);

      // Load GAPI
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });

      // Load GIS
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = resolve;
        document.head.appendChild(script);
      });

      // Initialize GAPI
      await new Promise((resolve) => {
        gapi.load('client', resolve);
      });

      await gapi.client.init({
        apiKey: 'AIzaSyDaH28CXlm0qV6p9SWAfHnYP1wg-gvd1IQ',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });

      // Check admin
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
          // Create token client
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: '279268985463-013b4esq66rfkuojg1ssrb9t0evsh1e0.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/drive',
            callback: (resp) => {
              if (resp.error) {
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
          tokenClient.requestAccessToken();
        } else {
          setIsLoadingAuth(false);
          alert('Admin access required');
        }
      } else {
        setIsLoadingAuth(false);
        alert('Please login as admin');
      }
    };

    loadApis();
  }, []);

  const loadDriveFiles = async (folderId = 'root') => {
    if (!accessToken) return;

    setLoading(true);
    try {
      // Load folders first
      const foldersRes = await gapi.client.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: "files(id,name,parents)",
        pageSize: 100,
      });
      setAllDriveFolders(foldersRes.result.files || []);

      // Load files
      const query = `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
      const filesRes = await gapi.client.drive.files.list({
        q: query,
        fields: "files(id,name,webViewLink,parents,createdTime,modifiedTime)",
        pageSize: 100,
        orderBy: 'name',
      });

      const driveFiles = filesRes.result.files || [];

      // Get Firestore metadata
      const filesWithMeta = [];
      for (const file of driveFiles) {
        const docSnap = await getDoc(doc(db, 'files', file.id));
        const fileData = docSnap.exists() ? docSnap.data() : {};
        const folder = foldersRes.result.files.find((f) => f.id === (file.parents?.[0]));

        filesWithMeta.push({
          id: file.id,
          name: file.name,
          webViewLink: file.webViewLink,
          folderName: folder ? folder.name : 'Root',
          ...fileData,
          tags: fileData.tags || {
            university: [],
            course: [],
            year: [],
            semester: [],
            subject: [],
            title: [],
            other: [],
          },
          showOnWebsite: fileData.showOnWebsite || false,
          isPremium: fileData.isPremium || false,
          price: fileData.price || 29,
        });
      }

      setFiles(filesWithMeta);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFileMetadata = async (fileId, updates) => {
    try {
      await setDoc(
        doc(db, 'files', fileId),
        { ...updates, lastUpdated: serverTimestamp() },
        { merge: true }
      );
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f))
      );
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const updateTag = async (fileId, tagField, value) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    const tags = { ...file.tags };
    tags[tagField] = value.split(',').map((t) => t.trim()).filter((t) => t);
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

  const handleFolderChange = (e) => {
    const folderId = e.target.value;
    setSelectedFolder(folderId);
    loadDriveFiles(folderId);
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
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const filteredFiles = files.filter((file) =>
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
        <button
          onClick={() => tokenClient?.requestAccessToken()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
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
        <button
          onClick={() => loadDriveFiles(selectedFolder)}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Refresh
        </button>
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
          {allDriveFolders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded text-center">
          <div className="text-xl font-bold">{files.length}</div>
          <div className="text-xs">Total</div>
        </div>
        <div className="bg-green-100 p-3 rounded text-center">
          <div className="text-xl font-bold">
            {files.filter((f) => f.showOnWebsite).length}
          </div>
          <div className="text-xs">Visible</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded text-center">
          <div className="text-xl font-bold">
            {files.filter((f) => f.isPremium).length}
          </div>
          <div className="text-xs">Premium</div>
        </div>
        <div className="bg-purple-100 p-3 rounded text-center">
          <div className="text-xl font-bold">
            ₹
            {files.reduce(
              (sum, f) => sum + (f.isPremium ? f.price : 0),
              0
            )}
          </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedFiles.size === files.length && files.length > 0
                    }
                    onChange={selectAllFiles}
                  />
                </th>
                <th className="p-2">File Name</th>
                <th className="p-2">Folder</th>
                <th className="p-2">University</th>
                <th className="p-2">Course</th>
                <th className="p-2">Year</th>
                <th className="p-2">Semester</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Title</th>
                <th className="p-2">Other</th>
                <th className="p-2">Price</th>
                <th className="p-2">Premium</th>
                <th className="p-2">Visible</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr key={file.id} className="border-b">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      defaultValue={file.name}
                      onBlur={(e) =>
                        updateFileMetadata(file.id, { name: e.target.value })
                      }
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="p-2">{file.folderName}</td>
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
                      onChange={(e) =>
                        updateFileMetadata(file.id, { price: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-20 px-2 py-1 border rounded"
                      disabled={!file.isPremium}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() =>
                        updateFileMetadata(file.id, { isPremium: !file.isPremium })
                      }
                      className={`px-2 py-1 rounded text-xs ${
                        file.isPremium ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}
                    >
                      {file.isPremium ? 'Premium' : 'Free'}
                    </button>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() =>
                        updateFileMetadata(file.id, {
                          showOnWebsite: !file.showOnWebsite,
                        })
                      }
                      className={`px-2 py-1 rounded text-xs ${
                        file.showOnWebsite ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {file.showOnWebsite ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-2">
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 mr-2"
                    >
                      View
                    </a>
                    <button
                      onClick={() => {
                        if (confirm('Delete?')) {
                          deleteDoc(doc(db, 'files', file.id)).then(() =>
                            setFiles(files.filter((f) => f.id !== file.id))
                          );
                        }
                      }}
                      className="text-red-600"
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FilesManager;