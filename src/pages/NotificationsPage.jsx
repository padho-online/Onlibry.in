// src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllNotifications, getLatestNotifications } from '../services/notificationService';
import { getAllCategories } from '../services/categoryService';
import NotificationCard from '../components/NotificationCard';

function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [activeCategory, setActiveCategory] = useState('all');

  // Get category from URL
  useEffect(() => {
    const categoryParam = searchParams.get('category') || 'all';
    const pageParam = parseInt(searchParams.get('page') || '1');
    setActiveCategory(categoryParam);
    setPagination(prev => ({ ...prev, page: pageParam }));
  }, [searchParams]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load notifications when category or page changes
  useEffect(() => {
    loadNotifications();
  }, [pagination.page, activeCategory]);

  const loadCategories = async () => {
    const data = await getAllCategories();
    setCategories(data);
  };

  const loadNotifications = async () => {
    setLoading(true);
    const result = await getAllNotifications(pagination.page, pagination.limit, activeCategory);
    
    setNotifications(result.notifications);
    setPagination(result.pagination);
    setLoading(false);
  };

  const handleCategoryChange = (categorySlug) => {
    setActiveCategory(categorySlug);
    setSearchParams({ category: categorySlug, page: '1' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setSearchParams({ category: activeCategory, page: newPage.toString() });
  };

  const getCategoryColor = (slug) => {
    const category = categories.find(c => c.slug === slug);
    const colorMap = {
      red: 'bg-red-100 text-red-700 border-red-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300'
    };
    return colorMap[category?.color || 'gray'] || colorMap.gray;
  };

  const getCategoryIcon = (slug) => {
    const category = categories.find(c => c.slug === slug);
    return category?.icon || '📢';
  };

  return (
    <div className="py-4 md:py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          📢 All Notifications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Stay updated with latest announcements
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-3 overflow-x-auto">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          📋 All
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.slug)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeCategory === category.slug
                ? `${getCategoryColor(category.slug)} border`
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Showing {notifications.length} of {pagination.total} notifications
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        // Empty State
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No notifications found</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeCategory !== 'all' ? 'Try changing the category filter' : 'Check back later for updates'}
          </p>
          {activeCategory !== 'all' && (
            <button
              onClick={() => handleCategoryChange('all')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
            >
              View All Notifications
            </button>
          )}
        </div>
      ) : (
        // Notifications List
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} compact={false} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              pagination.page === 1
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            ← Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              pagination.page === pagination.totalPages
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;