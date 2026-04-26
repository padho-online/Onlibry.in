import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const subsList = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.subscription?.isActive) {
          subsList.push({
            id: doc.id,
            email: userData.email,
            displayName: userData.displayName,
            subscription: userData.subscription,
            startDate: userData.subscription.startDate,
            endDate: userData.subscription.endDate
          });
        }
      });
      setSubscriptions(subsList);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
    setLoading(false);
  };

  const cancelSubscription = async (userId) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          'subscription.isActive': false
        });
        await loadSubscriptions();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
      }
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    if (filter === 'monthly') return sub.subscription.type === 'monthly';
    if (filter === 'annual') return sub.subscription.type === 'yearly';
    return true;
  });

  const stats = {
    total: subscriptions.length,
    monthly: subscriptions.filter(s => s.subscription.type === 'monthly').length,
    yearly: subscriptions.filter(s => s.subscription.type === 'yearly').length,
    revenue: subscriptions.reduce((sum, s) => {
      return sum + (s.subscription.type === 'monthly' ? 99 : 499);
    }, 0)
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Active Subscriptions
        </h2>
        <button
          onClick={loadSubscriptions}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Active Subs</div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.monthly}</div>
          <div className="text-xs text-gray-500">Monthly</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.yearly}</div>
          <div className="text-xs text-gray-500">Annual</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">₹{stats.revenue}</div>
          <div className="text-xs text-gray-500">Monthly Revenue</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {['all', 'monthly', 'annual'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition ${
              filter === type
                ? 'bg-green-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
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
                <th className="text-left py-3 px-2">Plan</th>
                <th className="text-left py-3 px-2">Start Date</th>
                <th className="text-left py-3 px-2">End Date</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map(sub => (
                <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 font-medium text-gray-800 dark:text-white">
                    {sub.displayName || 'N/A'}
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{sub.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.subscription.type === 'monthly' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {sub.subscription.type === 'monthly' ? 'PRO MONTHLY' : 'PRO ANNUAL'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-xs">
                    {sub.startDate?.toDate?.().toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="py-3 px-2 text-gray-500 text-xs">
                    {sub.endDate?.toDate?.().toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => cancelSubscription(sub.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSubs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No active subscriptions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SubscriptionsManagement;