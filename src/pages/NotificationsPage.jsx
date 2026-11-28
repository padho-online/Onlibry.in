// src/pages/NotificationsPage.jsx - D1 Database Version
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getNotificationsFromD1, getCategoriesFromD1 } from '../services/d1Service';
import NotificationCard from '../components/NotificationCard';
import { getIconComponent } from '../components/IconPicker';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

// Get category color class
const getCategoryColorClass = (color) => {
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
  return colorMap[color] || colorMap.gray;
};

import {getExamUpdates} from '../services/examFetchService';
import ExamUpdateCard from '../components/ExamUpdateCard';
function NotificationsPage() {
  const [examError,setExamError]=useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
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
    let cancelled=false;
    const run=async()=>{
      setLoading(true);setExamError('');
      const page=pagination.page,limit=pagination.limit;
      const include=activeCategory==='all'||activeCategory==='exam-update'||categories.some(c=>c.slug===activeCategory&&/exam update/i.test(c.name));
      try{
        if(!include){const r=await getNotificationsFromD1(page,limit,activeCategory);if(!cancelled){setNotifications(r.notifications||[]);setPagination({...r.pagination,page,limit});}return;}
        const examPromise=getExamUpdates().catch(()=>{if(!cancelled)setExamError('Automatic exam updates temporarily unavailable.');return [];});
        const first=await getNotificationsFromD1(1,100,activeCategory,true);
        const manual=[...(first.notifications||[])];
        for(let i=2;i<=Number(first.pagination?.totalPages||1);i++){const r=await getNotificationsFromD1(i,100,activeCategory);manual.push(...(r.notifications||[]));}
        const exams=await examPromise;
        const merged=[...new Map(manual.map(r=>[r.id,r])).values(),...exams.map(r=>({...r,id:'examfetch:'+r.id,examRecord:r}))].sort((a,b)=>String(b.examRecord?.sortDate||b.published_at||'').localeCompare(String(a.examRecord?.sortDate||a.published_at||'')));
        if(!cancelled){setNotifications(merged.slice((page-1)*limit,page*limit));setPagination({page,limit,total:merged.length,totalPages:Math.ceil(merged.length/limit)});}
      }catch(e){if(!cancelled){setExamError('Unable to load notifications.');setNotifications([]);setPagination({page,limit,total:0,totalPages:0});}}finally{if(!cancelled)setLoading(false);}
    };run();return()=>{cancelled=true;};
  }, [pagination.page, activeCategory, categories]);

  const loadCategories = async () => {
    const data = await getCategoriesFromD1();
    setCategories(data.some(c=>/exam update/i.test(c.name))?data:[...data,{id:'examfetch-category',slug:'exam-update',name:'Exam Update',color:'green',icon:'Bell'}]);
  };

  const handleCategoryChange = (categorySlug) => {
    setActiveCategory(categorySlug);
    setSearchParams({ category: categorySlug, page: '1' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setSearchParams({ category: activeCategory, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="py-4 md:py-6 w-full min-w-0 mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Notifications 📢
        </h1>
      </div>

      <Link to="/exam-updates" className="block mb-4 text-green-700 font-medium">Browse all exam updates →</Link>
      {examError&&<p role="status" className="text-sm text-red-600 mb-3">{examError}</p>}
      {/* Category Tabs */}
      <div className="mb-6">
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid size={14} />
              All
            </button>
            
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              const isActive = activeCategory === category.slug;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-1 ${
                    isActive
                      ? getCategoryColorClass(category.color)
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {IconComponent && <IconComponent size={14} />}
                  {category.name}
                </button>
              );
            })}
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
        <div className="notice-grid space-y-3 md:space-y-0">
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
          <LayoutGrid size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No notifications found</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeCategory !== 'all' ? 'Try changing the category filter' : 'Check back later for updates'}
          </p>
          {activeCategory !== 'all' && (
            <button
              onClick={() => handleCategoryChange('all')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
            >
              View All Notifications
            </button>
          )}
        </div>
      ) : (
        <div className="notice-grid space-y-3 md:space-y-0">
          {notifications.map((notification) => (
            notification.examRecord ? <ExamUpdateCard key={notification.id} record={notification.examRecord}/> : <NotificationCard key={notification.id} notification={notification} compact={false} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
              pagination.page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
              pagination.page === pagination.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;