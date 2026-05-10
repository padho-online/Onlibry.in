// src/components/Header.jsx
// UPDATED - Added cart badge + improved navigation

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';

import logo from '../assets/logo.png';

function Header() {

  const {
    user,
    logout,
    isSubscribed,
    subscriptionType
  } = useAuth();

  const { darkMode, toggleDarkMode } = useTheme();

  const { getCartCount } = useCart();

  const navigate = useNavigate();

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

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">

      <div className="container mx-auto px-4 py-3 max-w-7xl">

        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2"
          >

            <img
              src={logo}
              alt="Onlibry"
              className="h-10 w-auto"
            />

            <span className="text-xl font-bold text-green-600 dark:text-green-400 hidden sm:inline">
              Onlibry
            </span>

          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">

            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Home
            </Link>

            <Link
              to="/files"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              All Files
            </Link>

            <Link
              to="/folders"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Folders
            </Link>

            <Link
              to="/mock-tests"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Mock Tests
            </Link>

            <Link
              to="/quizzes"
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              Quiz
            </Link>

            {/* Saved Files */}
            {user && (
              <Link
                to="/saved-files"
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Saved Files
              </Link>
            )}

            {/* Pricing */}
            <Link
              to="/pricing"
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              Pricing
            </Link>

            {/* Cart */}
            <Link
              to="/pricing"
              state={{ activeTab: 'cart' }}
              className="relative text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              🛒 Cart

              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}

            </Link>

            {/* Subscription Badge */}
            {isSubscribed && (
              <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full">

                {subscriptionType === 'monthly'
                  ? 'PRO MONTHLY'
                  : subscriptionType === 'yearly'
                    ? 'PRO ANNUAL'
                    : 'PREMIUM'}

              </span>
            )}

          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-3">

            {/* Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-3">

              {user ? (

                <div className="flex items-center space-x-3">

                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Hi, {user.displayName?.split(' ')[0] || 'User'}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Logout
                  </button>

                </div>

              ) : (

                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                >
                  Login
                </button>

              )}

            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (

          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">

            <nav className="flex flex-col space-y-3">

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                Home
              </Link>

              <Link
                to="/files"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                All Files
              </Link>

              <Link
                to="/folders"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                Folders
              </Link>

              <Link
                to="/mock-tests"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                Mock Tests
              </Link>

              <Link
                to="/quizzes"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                Quiz
              </Link>

              {user && (
                <Link
                  to="/saved-files"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
                >
                  Saved Files
                </Link>
              )}

              {/* Pricing */}
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                Pricing
              </Link>

              {/* Cart */}
              <Link
                to="/pricing"
                state={{ activeTab: 'cart' }}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 py-2"
              >
                🛒 Cart

                {getCartCount() > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {getCartCount()}
                  </span>
                )}

              </Link>

              {/* Subscription */}
              {isSubscribed && (
                <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-fit">

                  {subscriptionType === 'monthly'
                    ? 'PRO MONTHLY'
                    : subscriptionType === 'yearly'
                      ? 'PRO ANNUAL'
                      : 'PREMIUM'}

                </span>
              )}

              {/* Auth */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">

                {user ? (
                  <>

                    <span className="block text-sm text-gray-600 dark:text-gray-400 py-2">
                      Hi, {user.displayName || user.email}
                    </span>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                      Logout
                    </button>

                  </>
                ) : (

                  <button
                    onClick={handleLogin}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                  >
                    Login
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