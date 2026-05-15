import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';

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

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString();
      }
      if (dateValue.toDate) {
        return dateValue.toDate().toLocaleDateString();
      }
      return 'N/A';
    } catch (e) {
      return 'N/A';
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
        <h2 className="text-xl font-bold text-gray-800">Active Subscriptions</h2>
        <button onClick={loadSubscriptions} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-purple-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Active Subs</div>
        </div>
        <div className="bg-blue-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.monthly}</div>
          <div className="text-xs text-gray-500">Monthly</div>
        </div>
        <div className="bg-green-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.yearly}</div>
          <div className="text-xs text-gray-500">Annual</div>
        </div>
        <div className="bg-yellow-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">₹{stats.revenue}</div>
          <div className="text-xs text-gray-500">Monthly Revenue</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
        {['all', 'monthly', 'annual'].map(type => (
          <button key={type} onClick={() => setFilter(type)} className={`px-3 py-1 rounded-lg text-sm capitalize transition ${filter === type ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr><th className="p-3 text-left">User</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Plan</th><th className="p-3 text-left">Start Date</th><th className="p-3 text-left">End Date</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr>
            </thead>
            <tbody>
              {filteredSubs.map(sub => (
                <tr key={sub.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{sub.displayName || 'N/A'}</td>
                  <td className="p-3 text-gray-600">{sub.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.subscription.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {sub.subscription.type === 'monthly' ? 'PRO MONTHLY' : 'PRO ANNUAL'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs">{formatDate(sub.startDate)}</td>
                  <td className="p-3 text-gray-500 text-xs">{formatDate(sub.endDate)}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span></td>
                  <td className="p-3"><button onClick={() => cancelSubscription(sub.id)} className="text-red-600 hover:text-red-800 text-sm">Cancel</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSubs.length === 0 && <div className="text-center py-12 text-gray-500">No active subscriptions found</div>}
        </div>
      )}
    </div>
  );
}

export default SubscriptionsManagement;