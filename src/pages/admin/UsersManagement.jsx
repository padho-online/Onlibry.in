import React, { useState, useEffect } from 'react';
import { getUsersFromD1 } from '../../services/d1Service';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const ADMIN_KEY = import.meta.env.VITE_NOTIFICATION_ADMIN_KEY || 'HabibulAdmin@2025';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsersFromD1(ADMIN_KEY, pagination.page, pagination.limit, searchTerm);
      
      if (result.success && result.users) {
        setUsers(result.users);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || 0,
          totalPages: Math.ceil((result.pagination?.total || 0) / prev.limit)
        }));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users from D1:', error);
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [pagination.page, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRefresh = () => {
    loadUsers();
  };

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.is_admin === 1).length,
    subscribed: users.filter(u => u.subscription_type && u.subscription_type !== '' && u.subscription_type !== 'free').length,
    banned: users.filter(u => u.is_banned === 1).length
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Users Management (D1)
        </h2>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Users</div>
        </div>
        <div className="bg-green-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.admins}</div>
          <div className="text-xs text-gray-500">Admins</div>
        </div>
        <div className="bg-yellow-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{stats.subscribed}</div>
          <div className="text-xs text-gray-500">Subscribed</div>
        </div>
        <div className="bg-red-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-600">{stats.banned}</div>
          <div className="text-xs text-gray-500">Banned</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Users Table */}
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
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-2">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {user.display_name || 'No Name'}
                  </div>
                  <div className="text-xs text-gray-400">{user.id?.slice(0, 8)}...</div>
                </td>
                <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{user.email}</td>
                <td className="py-3 px-2 text-gray-500 text-xs">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-3 px-2">
                  {user.subscription_type && user.subscription_type !== '' && user.subscription_type !== 'free' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {user.subscription_type}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Free</span>
                  )}
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs ${user.is_admin === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.is_admin === 1 ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs ${user.is_banned === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {user.is_banned === 1 ? 'Banned' : 'Active'}
                  </span>
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

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 rounded text-sm bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 rounded text-sm bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
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
              <p><strong>Name:</strong> {selectedUser.display_name || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>User ID:</strong> {selectedUser.id}</p>
              <p><strong>Joined:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</p>
              <p><strong>Subscription:</strong> {selectedUser.subscription_type || 'Free'}</p>
              <p><strong>Subscription End:</strong> {selectedUser.subscription_end ? new Date(selectedUser.subscription_end).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;