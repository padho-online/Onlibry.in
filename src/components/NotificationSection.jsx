// src/components/NotificationSection.jsx - D1 Database Version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLatestNotificationsFromD1 } from '../services/d1Service';
import NotificationCard from './NotificationCard';

function NotificationSection() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getLatestNotificationsFromD1(5);
    setNotifications(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 mb-8 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 mb-8 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">
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