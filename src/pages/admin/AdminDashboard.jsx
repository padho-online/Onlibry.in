import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('logs');

  const tabs = [
    { id: 'logs', name: 'Payment Logs', path: '/admin/logs' },
    { id: 'users', name: 'Users', path: '/admin/users' },
    { id: 'subscriptions', name: 'Subscriptions', path: '/admin/subscriptions' },
    { id: 'plans', name: 'Plans', path: '/admin/plans' },
    { id: 'files', name: 'Files Manager', path: '/admin/files' }
  ];

  useEffect(() => {
    const currentTab = tabs.find(tab => location.pathname === tab.path);
    if (currentTab) {
      setActiveTab(currentTab.id);
    }
  }, [location.pathname]);

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-64">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sticky top-24">
            <div className="text-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">Admin Panel</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
            </div>
            
            <nav className="space-y-1">
              {tabs.map(tab => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;