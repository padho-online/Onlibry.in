// src/components/NotificationSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLatestNotifications } from '../services/notificationService';
import NotificationCard from './NotificationCard';

function NotificationSection() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getLatestNotifications(5);
    setNotifications(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">📢 Latest Updates</h2>
          <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-3 animate-pulse h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          📢 Latest Updates
        </h2>
        <Link 
          to="/notifications" 
          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
        >
          See All →
        </Link>
      </div>
      
      <div className="space-y-2">
        {notifications.map((notif) => (
          <NotificationCard key={notif.id} notification={notif} compact={true} />
        ))}
      </div>
    </div>
  );
}

export default NotificationSection;