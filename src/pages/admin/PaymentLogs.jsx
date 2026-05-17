// src/pages/admin/PaymentLogs.jsx - D1 Database Version
import React, { useState, useEffect } from 'react';

function PaymentLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load logs from D1 API
  const loadLogs = async () => {
    setLoading(true);
    try {
      // Fetch from D1 API
      const response = await fetch(`${import.meta.env.VITE_D1_API_URL}/api/admin/payment-logs?t=${Date.now()}`, {
        headers: { 'X-Admin-Key': import.meta.env.VITE_NOTIFICATION_ADMIN_KEY || 'HabibulAdmin@2025' }
      });
      const data = await response.json();
      
      if (data.success && data.logs) {
        setLogs(data.logs);
      } else {
        console.log('No logs from D1, showing empty');
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading payment logs from D1:', error);
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.pending;
  };

  const getEventIcon = (event) => {
    const icons = {
      payment_initiated: '🔄',
      payment_success: '✅',
      payment_failed: '❌',
      payment_cancelled: '🚫',
      single_checkout_initiated: '🛒'
    };
    return icons[event] || '📋';
  };

  const getEventBadge = (event) => {
    const styles = {
      payment_initiated: 'bg-blue-100 text-blue-800',
      payment_success: 'bg-green-100 text-green-800',
      payment_failed: 'bg-red-100 text-red-800',
      payment_cancelled: 'bg-gray-100 text-gray-800',
      single_checkout_initiated: 'bg-purple-100 text-purple-800'
    };
    return styles[event] || 'bg-gray-100 text-gray-800';
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (log.user_email && log.user_email.toLowerCase().includes(term)) ||
        (log.plan && log.plan.toLowerCase().includes(term)) ||
        (log.payment_id && log.payment_id.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    cancelled: logs.filter(l => l.status === 'cancelled').length,
    pending: logs.filter(l => l.status === 'pending').length,
    totalRevenue: logs.filter(l => l.status === 'success').reduce((sum, l) => sum + (l.amount || 0), 0),
    uniqueUsers: new Set(logs.filter(l => l.user_id).map(l => l.user_id)).size
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          💰 Payment Logs (D1)
        </h2>
        <button
          onClick={loadLogs}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-gray-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Events</div>
        </div>
        <div className="bg-green-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-xs text-gray-500">✅ Success</div>
        </div>
        <div className="bg-red-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-500">❌ Failed</div>
        </div>
        <div className="bg-yellow-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.cancelled}</div>
          <div className="text-xs text-gray-500">🚫 Cancelled</div>
        </div>
        <div className="bg-blue-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">⏳ Pending</div>
        </div>
        <div className="bg-purple-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">💰 Total Revenue</div>
        </div>
        <div className="bg-indigo-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.uniqueUsers}</div>
          <div className="text-xs text-gray-500">👥 Unique Users</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search by email, plan, or payment ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
        {['all', 'success', 'failed', 'cancelled', 'pending'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? '📋 All' : status === 'success' ? '✅ Success' : status === 'failed' ? '❌ Failed' : status === 'cancelled' ? '🚫 Cancelled' : '⏳ Pending'}
            {status !== 'all' && (
              <span className="ml-1 text-xs opacity-75">
                ({status === 'success' ? stats.success : status === 'failed' ? stats.failed : status === 'cancelled' ? stats.cancelled : stats.pending})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-3 text-sm text-gray-500">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">📅 Time</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">👤 User</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">🔄 Event</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">📦 Plan</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">💰 Amount</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">📊 Status</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600">💳 Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="py-2 px-2 whitespace-nowrap text-gray-600 text-xs font-mono">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-2 px-2">
                    <div className="font-medium text-gray-800 text-sm truncate max-w-[180px]" title={log.user_email}>
                      {log.user_email && log.user_email !== 'guest' ? (
                        <span className="flex items-center gap-1">
                          <span>👤</span> {log.user_email}
                        </span>
                      ) : (
                        <span className="text-gray-400">👤 Guest User</span>
                      )}
                    </div>
                    {log.user_id && log.user_id !== 'guest' && (
                      <div className="text-xs text-gray-400 font-mono mt-0.5" title={log.user_id}>
                        ID: {log.user_id.slice(0, 10)}...
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEventBadge(log.event)}`}>
                      <span>{getEventIcon(log.event)}</span>
                      <span>{log.event?.replace('payment_', '').replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-semibold text-gray-700">
                      {log.plan || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-bold text-green-600">
                      ₹{log.amount?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                      {log.status === 'success' ? '✅ Success' : 
                       log.status === 'failed' ? '❌ Failed' : 
                       log.status === 'cancelled' ? '🚫 Cancelled' : 
                       log.status === 'pending' ? '⏳ Pending' : log.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {log.payment_id ? (
                      <span className="text-xs text-gray-500 font-mono" title={log.payment_id}>
                        {log.payment_id.slice(0, 12)}...
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">No payment logs found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? 'Try a different search term' : 'No transactions have been made yet'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentLogs;