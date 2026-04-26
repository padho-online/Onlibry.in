import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(usersQuery);
      const usersList = [];
      querySnapshot.forEach(doc => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isAdmin: !currentStatus });
      await loadUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  const toggleBanStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isBanned: !currentStatus });
      await loadUsers();
    } catch (error) {
      console.error('Error updating ban status:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Users Management
        </h2>
        <button
          onClick={loadUsers}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{users.length}</div>
          <div className="text-xs text-gray-500">Total Users</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{users.filter(u => u.isAdmin).length}</div>
          <div className="text-xs text-gray-500">Admins</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{users.filter(u => u.subscription?.isActive).length}</div>
          <div className="text-xs text-gray-500">Subscribed</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-600">{users.filter(u => u.isBanned).length}</div>
          <div className="text-xs text-gray-500">Banned</div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-2">User</th>
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-left py-3 px-2">Joined</th>
                <th className="text-left py-3 px-2">Subscription</th>
                <th className="text-left py-3 px-2">Admin</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-800 dark:text-white">
                      {user.displayName || 'No Name'}
                    </div>
                    <div className="text-xs text-gray-400">{user.id?.slice(0, 8)}...</div>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">
                    {user.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="py-3 px-2">
                    {user.subscription?.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {user.subscription.type}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Free</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                      className={`px-2 py-1 rounded text-xs ${
                        user.isAdmin 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                      }`}
                    >
                      {user.isAdmin ? 'Admin' : 'Make Admin'}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => toggleBanStatus(user.id, user.isBanned)}
                      className={`px-2 py-1 rounded text-xs ${
                        user.isBanned 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                      }`}
                    >
                      {user.isBanned ? 'Banned' : 'Ban User'}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <p><strong>Name:</strong> {selectedUser.displayName || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>User ID:</strong> {selectedUser.id}</p>
              <p><strong>Joined:</strong> {selectedUser.createdAt?.toDate?.().toLocaleString() || 'N/A'}</p>
              <p><strong>Subscription:</strong> {selectedUser.subscription?.type || 'Free'}</p>
              <p><strong>Subscribed Until:</strong> {selectedUser.subscription?.endDate?.toDate?.().toLocaleDateString() || 'N/A'}</p>
              <p><strong>Saved Files:</strong> {selectedUser.savedFiles?.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;