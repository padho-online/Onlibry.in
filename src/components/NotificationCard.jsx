// src/components/NotificationCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryColorClass } from '../services/categoryService';

function NotificationCard({ notification, compact = false }) {
  const navigate = useNavigate();
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };
  
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const handleClick = () => {
    navigate(`/notification/${notification.id}`);
  };
  
  const categoryColorClass = getCategoryColorClass(notification.category_color);
  
  if (compact) {
    return (
      <div 
        onClick={handleClick}
        className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 cursor-pointer hover:shadow-md transition border-l-4"
        style={{ borderLeftColor: getColorCode(notification.category_color) }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColorClass}`}>
                <span className="mr-1">{notification.category_icon}</span>
                {notification.category_name}
              </span>
              {notification.is_pinned === 1 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  📌 Pinned
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
              {notification.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(notification.published_at)}
            </p>
          </div>
          <span className="text-gray-400 text-sm ml-2">›</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-3 cursor-pointer hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{notification.category_icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColorClass}`}>
              {notification.category_name}
            </span>
            {notification.is_pinned === 1 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                📌 Pinned
              </span>
            )}
            <span className="text-xs text-gray-400">
              👁️ {notification.views || 0} views
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">
            {notification.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {truncateText(notification.content, 120)}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              📅 {formatDate(notification.published_at)}
            </span>
            <span className="text-green-600 text-sm">Read More →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColorCode(color) {
  const colorMap = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    purple: '#a855f7',
    pink: '#ec4899',
    orange: '#f97316',
    gray: '#6b7280',
    indigo: '#6366f1'
  };
  return colorMap[color] || '#6b7280';
}

export default NotificationCard;