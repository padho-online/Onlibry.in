// src/pages/admin/PaymentLogs.jsx
// Payment Logs - Direct Firestore query

import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

function PaymentLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const logsQuery = query(
        collection(db, 'paymentLogs'),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
      const querySnapshot = await getDocs(logsQuery);
      const logsList = [];
      querySnapshot.forEach(doc => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsList);
    } catch (error) {
      console.error('Error loading payment logs:', error);
    }
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }
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
      success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return styles[status] || styles.pending;
  };

  const getEventIcon = (event) => {
    const icons = {
      payment_initiated: '🔄',
      payment_success: '✅',
      payment_failed: '❌',
      payment_modal_closed: '🚫'
    };
    return icons[event] || '📋';
  };

  const getEventBadge = (event) => {
    const styles = {
      payment_initiated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      payment_success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      payment_failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      payment_modal_closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return styles[event] || 'bg-gray-100 text-gray-800';
  };

  // Filter logs based on status and search term
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
        (log.plan && log.plan.toLowerCase().includes(term)) ||
        (log.paymentId && log.paymentId.toLowerCase().includes(term))
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
    uniqueUsers: new Set(logs.filter(l => l.userId).map(l => l.userId)).size
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          💰 Payment Logs
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
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Events</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-xs text-gray-500">✅ Success</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-500">❌ Failed</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.cancelled}</div>
          <div className="text-xs text-gray-500">🚫 Cancelled</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">⏳ Pending</div>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">💰 Total Revenue</div>
        </div>
        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-xl p-3 text-center">
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
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {['all', 'success', 'failed', 'cancelled', 'pending'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
        <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
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
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 sticky top-0">
              <tr>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">📅 Time</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">👤 User</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">🔄 Event</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">📦 Plan</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">💰 Amount</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">📊 Status</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-gray-300">💳 Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id} 
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${
                    index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-gray-800/20'
                  }`}
                >
                  <td className="py-2 px-2 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs font-mono">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-2 px-2">
                    <div className="font-medium text-gray-800 dark:text-white text-sm truncate max-w-[180px]" title={log.userEmail}>
                      {log.userEmail && log.userEmail !== 'guest' ? (
                        <span className="flex items-center gap-1">
                          <span>👤</span> {log.userEmail}
                        </span>
                      ) : (
                        <span className="text-gray-400">👤 Guest User</span>
                      )}
                    </div>
                    {log.userId && log.userId !== 'guest' && (
                      <div className="text-xs text-gray-400 font-mono mt-0.5" title={log.userId}>
                        ID: {log.userId.slice(0, 10)}...
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
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {log.plan || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span className="font-bold text-green-600 dark:text-green-400">
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
                    {log.paymentId && log.paymentId !== 'N/A' ? (
                      <span className="text-xs text-gray-500 font-mono" title={log.paymentId}>
                        {log.paymentId.slice(0, 12)}...
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
              <p className="text-gray-500 dark:text-gray-400 text-lg">No payment logs found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? 'Try a different search term' : 'No transactions have been made yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Export Button */}
      {logs.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const csvData = filteredLogs.map(log => ({
                'Timestamp': formatDate(log.timestamp),
                'User Email': log.userEmail || 'guest',
                'User ID': log.userId || 'guest',
                'Event': log.event,
                'Plan': log.plan,
                'Amount': log.amount,
                'Status': log.status,
                'Payment ID': log.paymentId || 'N/A',
                'Error': log.error || ''
              }));
              
              const headers = Object.keys(csvData[0]);
              const csvRows = [
                headers.join(','),
                ...csvData.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
              ];
              
              const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payment_logs_${new Date().toISOString().slice(0, 19)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
          >
            📥 Export to CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentLogs;