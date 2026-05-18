// src/components/NotificationCard.jsx
import React from 'react';
import { getIconComponent } from './IconPicker';

// Get color class for category dot
const getCategoryDotColor = (color) => {
  const colorMap = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500'
  };
  return colorMap[color] || 'bg-gray-500';
};

function NotificationCard({ notification, compact = false }) {
  
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
    if (notification.link && notification.link.trim() !== '') {
      if (notification.link.startsWith('/')) {
        window.location.href = notification.link;
      } else {
        window.open(notification.link, '_blank');
      }
    }
  };
  
  const CategoryIcon = getIconComponent(notification.category_icon);
  const dotColor = getCategoryDotColor(notification.category_color);
  
  if (compact) {
    return (
      <div 
        onClick={handleClick}
        className={`bg-white rounded-lg p-3 mb-2 cursor-pointer hover:shadow-md transition border border-gray-200 ${!notification.link ? 'cursor-default' : ''}`}
        style={{ cursor: notification.link ? 'pointer' : 'default' }}
      >
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`}></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CategoryIcon size={12} className="text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-800">
                {notification.title}
              </h4>
            </div>
            <p className="text-xs text-gray-500 line-clamp-4">
              {truncateText(notification.content,250)}
            </p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-gray-400">
                {formatDate(notification.published_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-sm p-4 mb-3 hover:shadow-md transition border border-gray-200 ${!notification.link ? 'cursor-default' : ''}`}
      style={{ cursor: notification.link ? 'pointer' : 'default' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
          <CategoryIcon size={16} className="text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-800 mb-2">
            {notification.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {truncateText(notification.content, 150)}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              📅 {formatDate(notification.published_at)}
            </span>
            {notification.link && (
              <span className="text-green-600 text-sm">Read More →</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationCard;