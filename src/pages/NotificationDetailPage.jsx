// src/pages/NotificationDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNotificationByIdFromD1 } from '../services/d1Service';
import { getCategoryColorClass } from '../services/categoryService';


function NotificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotification();
  }, [id]);

  const loadNotification = async () => {
  setLoading(true);
  setError(null);
  const data = await getNotificationByIdFromD1(id);
  
  if (data) {
    setNotification(data);
  } else {
    setError('Notification not found');
  }
  setLoading(false);
};

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const categoryColorClass = notification?.category_color ? 
    getCategoryColorClass(notification.category_color) : '';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{error || 'Not Found'}</h2>
        <p className="text-gray-500 mb-4">The notification you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/notifications')}
          className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          Back to Notifications
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 md:py-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/notifications')}
        className="mb-4 text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
      >
        ← Back to Notifications
      </button>

      {/* Notification Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header with Category */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`text-xs px-3 py-1 rounded-full ${categoryColorClass}`}>
              <span className="mr-1">{notification.category_icon}</span>
              {notification.category_name}
            </span>
            {notification.is_pinned === 1 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                📌 Pinned
              </span>
            )}
            <span className="text-xs text-gray-400">
              👁️ {notification.views || 0} views
            </span>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {notification.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>📅 {formatDate(notification.published_at)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {notification.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-3">
            {notification.link && (
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                🔗 Visit Link
              </a>
            )}
            <button
              onClick={handleShare}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              📢 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationDetailPage;