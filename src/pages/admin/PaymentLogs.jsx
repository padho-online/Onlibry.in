import React, { useState, useEffect } from 'react';
import { getAllPaymentLogs } from '../../services/paymentLogService';

function PaymentLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getAllPaymentLogs(200);
    setLogs(data);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
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

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.status === filter);

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    cancelled: logs.filter(l => l.status === 'cancelled').length,
    totalRevenue: logs.filter(l => l.status === 'success').reduce((sum, l) => sum + (l.amount || 0), 0)
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Payment Logs
        </h2>
        <button
          onClick={loadLogs}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-gray-800 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Events</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.success}</div>
          <div className="text-xs text-gray-500">Success</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{stats.cancelled}</div>
          <div className="text-xs text-gray-500">Cancelled</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">₹{stats.totalRevenue}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
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
            {status}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-2">Time</th>
                <th className="text-left py-3 px-2">User</th>
                <th className="text-left py-3 px-2">Event</th>
                <th className="text-left py-3 px-2">Plan</th>
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-2 px-2 whitespace-nowrap text-gray-500 text-xs">
                    {log.timestamp?.toDate?.().toLocaleString() || 'N/A'}
                  </td>
                  <td className="py-2 px-2">
                    <div className="font-medium text-gray-800 dark:text-white text-xs">{log.userEmail || 'guest'}</div>
                    <div className="text-xs text-gray-400">{log.userId?.slice(0, 8)}...</div>
                  </td>
                  <td className="py-2 px-2">
                    <span className="text-lg">{getEventIcon(log.event)}</span>
                    <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">{log.event?.replace('payment_', '')}</span>
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-700 dark:text-gray-300">{log.plan || 'N/A'}</td>
                  <td className="py-2 px-2 font-medium text-gray-800 dark:text-white">₹{log.amount || 0}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                      {log.status || 'unknown'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-500 truncate max-w-[100px]">
                    {log.paymentId || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No payment logs found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentLogs;