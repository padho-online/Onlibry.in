// src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllNotifications } from '../services/notificationService';
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

  useEffect(() => {
    const categoryParam = searchParams.get('category') || 'all';
    const pageParam = parseInt(searchParams.get('page') || '1');
    setActiveCategory(categoryParam);
    setPagination(prev => ({ ...prev, page: pageParam }));
  }, [searchParams]);

  useEffect(() => {
    loadCategories();
  }, []);

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
      red: 'border-red-500 bg-red-50 text-red-700',
      blue: 'border-blue-500 bg-blue-50 text-blue-700',
      green: 'border-green-500 bg-green-50 text-green-700',
      yellow: 'border-yellow-500 bg-yellow-50 text-yellow-700',
      purple: 'border-purple-500 bg-purple-50 text-purple-700',
      pink: 'border-pink-500 bg-pink-50 text-pink-700',
      orange: 'border-orange-500 bg-orange-50 text-orange-700',
      gray: 'border-gray-500 bg-gray-50 text-gray-700'
    };
    return colorMap[category?.color || 'gray'] || colorMap.gray;
  };

  return (
    <div className="py-4 md:py-6 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
    Notifications
        </h1>
       
      </div>

      {/* Category Tabs - Scrollable Horizontal */}
      <div className="mb-6">
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeCategory === category.slug
                    ? getCategoryColor(category.slug)
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-500">
          Showing {notifications.length} of {pagination.total} notifications
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-200">
              <div className="flex gap-3">
                <div className="w-3 h-3 bg-gray-200 rounded-full mt-1"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 text-lg">No notifications found</p>
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
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ← Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              pagination.page === pagination.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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