import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

function FilesManager() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const filesQuery = query(collection(db, 'files'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(filesQuery);
      const filesList = [];
      querySnapshot.forEach(doc => {
        filesList.push({ id: doc.id, ...doc.data() });
      });
      setFiles(filesList);
    } catch (error) {
      console.error('Error loading files:', error);
    }
    setLoading(false);
  };

  const toggleShowOnWeb = async (fileId, currentStatus) => {
    try {
      const fileRef = doc(db, 'files', fileId);
      await updateDoc(fileRef, { showOnWebsite: !currentStatus });
      await loadFiles();
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const togglePremium = async (fileId, currentStatus) => {
    try {
      const fileRef = doc(db, 'files', fileId);
      await updateDoc(fileRef, { isPremium: !currentStatus, isFree: currentStatus });
      await loadFiles();
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const updateFilePrice = async (fileId, price) => {
    try {
      const fileRef = doc(db, 'files', fileId);
      await updateDoc(fileRef, { price: parseInt(price) || 0 });
      await loadFiles();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const deleteFile = async (fileId, fileName) => {
    if (window.confirm(`Delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'files', fileId));
        await loadFiles();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  };

  const filteredFiles = files.filter(file =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Files Manager
        </h2>
        <button
          onClick={loadFiles}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by file name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
          <div className="text-xl font-bold text-purple-600">₹{files.filter(f => f.isPremium).reduce((sum, f) => sum + (f.price || 29), 0)}</div>
          <div className="text-xs text-gray-500">Potential Revenue</div>
        </div>
      </div>

      {/* Files Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-2">File Name</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Price</th>
                <th className="text-left py-3 px-2">Visible</th>
                <th className="text-left py-3 px-2">Premium</th>
                <th className="text-left py-3 px-2">Tags</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => (
                <tr key={file.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-800 dark:text-white max-w-[200px] truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-400">{file.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="py-3 px-2">
                    {file.webViewLink ? (
                      <a href={file.webViewLink} target="_blank" className="text-blue-600 text-xs">Drive</a>
                    ) : (
                      <span className="text-gray-400 text-xs">Internal</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {file.isPremium ? (
                      <input
                        type="number"
                        defaultValue={file.price || 29}
                        onBlur={(e) => updateFilePrice(file.id, e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        min="9"
                        max="499"
                      />
                    ) : (
                      <span className="text-gray-500">Free</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => toggleShowOnWeb(file.id, file.showOnWebsite)}
                      className={`px-2 py-1 rounded text-xs ${
                        file.showOnWebsite 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {file.showOnWebsite ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => togglePremium(file.id, file.isPremium)}
                      className={`px-2 py-1 rounded text-xs ${
                        file.isPremium 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {file.isPremium ? `Premium (₹${file.price || 29})` : 'Free'}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-500 max-w-[150px] truncate">
                    {file.tags?.subject?.join(', ') || file.tags?.other?.join(', ') || '-'}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => setEditingFile(file)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteFile(file.id, file.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No files found
            </div>
          )}
        </div>
      )}

      {/* Edit File Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingFile(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Edit File</h3>
              <button onClick={() => setEditingFile(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">File Name</label>
                <input
                  type="text"
                  value={editingFile.name}
                  onChange={(e) => setEditingFile({...editingFile, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  defaultValue={editingFile.tags?.other?.join(', ') || ''}
                  onBlur={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                    setEditingFile({...editingFile, tags: { ...editingFile.tags, other: tags }});
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., mathematics, pyq, 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingFile.description || ''}
                  onChange={(e) => setEditingFile({...editingFile, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const fileRef = doc(db, 'files', editingFile.id);
                      await updateDoc(fileRef, {
                        name: editingFile.name,
                        description: editingFile.description,
                        tags: editingFile.tags
                      });
                      setEditingFile(null);
                      await loadFiles();
                    } catch (error) {
                      console.error('Error updating file:', error);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesManager;