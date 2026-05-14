// src/components/Header.jsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

import {
  Home,
  SquareLibrary,
  Folder,
  SquarePen,
  NotebookPen,
  BellRing,
  Bookmark,
  CreditCard,
  ShoppingCart,
  LogOut,
  LogIn,
  Menu,
  X,
} from 'lucide-react';

import logo from '../assets/logo.png';

function Header() {
  const { user, logout, isSubscribed } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // Better path matching function
  const isActive = (path) => {
    const currentPath = location.pathname;
    
    // Exact match for home
    if (path === '/') {
      return currentPath === '/';
    }
    
    // For other routes, check if current path starts with the path
    // This handles nested routes like /files/123
    return currentPath.startsWith(path);
  };

  // Debug log to see current path
  console.log('Current path:', location.pathname);

  const NavLink = ({ to, icon: Icon, label, onClick }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`nav-link flex items-center gap-2 transition py-2 px-3 rounded-lg hover:bg-gray-100 ${
          active ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'
        }`}
      >
        <Icon size={20} className={active ? 'text-green-600' : 'text-gray-700'} />
        <span className={active ? 'font-medium' : ''}>{label}</span>
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-3 py-3 max-w-7xl">
        <div className="flex items-center justify-between">

          {/* LEFT SECTION - Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Onlibry" className="h-8 w-auto" />
              <span className="text-xl font-bold text-green-600 hidden sm:inline">
                Onlibry
              </span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={Home} label="Home" />
            <NavLink to="/files" icon={SquareLibrary} label="Files" />
            <NavLink to="/folders" icon={Folder} label="Folders" />
            <NavLink to="/mock-tests" icon={SquarePen} label="Mock Tests" />
            <NavLink to="/quizzes" icon={NotebookPen} label="Quiz" />
            <NavLink to="/notifications" icon={BellRing} label="Notice" />
            {user && <NavLink to="/saved-files" icon={Bookmark} label="Saved" />}
            <NavLink to="/pricing" icon={CreditCard} label="Pricing" />
          </nav>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-1">

            {/* MOBILE QUICK NAV ICONS */}
            <div className="md:hidden flex items-center gap-0.5">
              <Link
                to="/files"
                className={`p-2 rounded-lg transition ${
                  isActive('/files') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SquareLibrary size={20} className={isActive('/files') ? 'text-green-600' : 'text-gray-700'} />
              </Link>

              <Link
                to="/folders"
                className={`p-2 rounded-lg transition ${
                  isActive('/folders') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Folder size={20} className={isActive('/folders') ? 'text-green-600' : 'text-gray-700'} />
              </Link>

              <Link
                to="/mock-tests"
                className={`p-2 rounded-lg transition ${
                  isActive('/mock-tests') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SquarePen size={20} className={isActive('/mock-tests') ? 'text-green-600' : 'text-gray-700'} />
              </Link>

              <Link
                to="/quizzes"
                className={`p-2 rounded-lg transition ${
                  isActive('/quizzes') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <NotebookPen size={20} className={isActive('/quizzes') ? 'text-green-600' : 'text-gray-700'} />
              </Link>

              <Link
                to="/notifications"
                className={`p-2 rounded-lg transition ${
                  isActive('/notifications') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BellRing size={20} className={isActive('/quizzes') ? 'text-green-600' : 'text-gray-700'} />
              </Link>
            </div>

            {/* CART ICON */}
            <Link
              to="/pricing"
              state={{ activeTab: 'cart' }}
              className={`relative p-2 rounded-lg transition ${
                isActive('/pricing') ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart size={20} className={isActive('/pricing') ? 'text-green-600' : 'text-gray-700'} />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* PRO BADGE */}
            {isSubscribed && (
              <span className="hidden md:inline-block px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full">
                PRO
              </span>
            )}

            {/* DESKTOP AUTH BUTTONS */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Hi, {user.displayName?.split(' ')[0] || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    <LogOut size={20} className="text-red-500" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition text-white font-medium"
                >
                  Login
                </button>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <nav className="flex flex-col gap-1">
              <NavLink to="/" icon={Home} label="Home" onClick={() => setMobileMenuOpen(false)} />
              {user && (
                <NavLink to="/saved-files" icon={Bookmark} label="Saved Files" onClick={() => setMobileMenuOpen(false)} />
              )}
              <NavLink to="/pricing" icon={CreditCard} label="Pricing" onClick={() => setMobileMenuOpen(false)} />

              {/* Mobile Auth Section */}
              <div className="pt-3 mt-2 border-t border-gray-200">
                {user ? (
                  <>
                    <span className="block text-sm text-gray-600 py-2 px-3">
                      Hi, {user.displayName || user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg transition"
                  >
                    <LogIn size={20} />
                    <span>Login</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;