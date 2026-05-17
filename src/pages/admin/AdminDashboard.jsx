// src/pages/admin/AdminDashboard.jsx - Mobile optimized - White Theme
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Upload, Files, CreditCard, Users, Calendar, Tag, Home, Menu, X } from 'lucide-react';
import HomeEditor from './HomeEditor';

function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('upload');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'upload', name: 'Upload', icon: Upload, path: '/admin/upload' },
    { id: 'files', name: 'Files', icon: Files, path: '/admin/files' },
    { id: 'home', name: 'Home Editor', icon: Home, path: '/admin/home' },
    { id: 'logs', name: 'Payments', icon: CreditCard, path: '/admin/logs' },
    { id: 'users', name: 'Users', icon: Users, path: '/admin/users' },
    { id: 'plans', name: 'Plans', icon: Tag, path: '/admin/plans' }
  ];

  useEffect(() => {
    const currentTab = tabs.find(tab => location.pathname === tab.path);
    if (currentTab) setActiveTab(currentTab.id);
    else if (location.pathname === '/admin') setActiveTab('upload');
  }, [location.pathname]);

  return (
    <div className="py-3 md:py-6">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg bg-gray-100">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar - Mobile Drawer */}
        <div className={`fixed inset-0 z-50 bg-black/50 transition-all md:hidden ${mobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={() => setMobileMenuOpen(false)}>
          <div className={`absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Admin Panel</h3>
              <p className="text-[10px] text-gray-500 mt-1 truncate">{user?.email}</p>
            </div>
            <nav className="p-2">
              {tabs.map(tab => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-md p-4 sticky top-20 border border-gray-200">
            <div className="text-center mb-4 pb-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Admin Panel</h3>
              <p className="text-[11px] text-gray-500 mt-1">{user?.email}</p>
            </div>
            <nav className="space-y-1">
              {tabs.map(tab => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;