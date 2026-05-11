// src/components/Header.jsx

import React, { useState } from 'react';

import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

import {
  Home,
  SquareLibrary,
  Folder,
  SquarePen,
  NotebookPen,
  Bookmark,
  CreditCard,
  ShoppingCart,
  LogOut,
  LogIn,
  Menu,
  X
} from 'lucide-react';

import logo from '../assets/logo.png';

function Header() {

  const { user, logout, isSubscribed } = useAuth();
  const { getCartCount } = useCart();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // LOGOUT
  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  // LOGIN
  const handleLogin = () => {
    navigate('/login');
    setMobileMenuOpen(false);
  };

  // DESKTOP NAV LINK
  const NavLink = ({
    to,
    icon: Icon,
    label,
    onClick
  }) => (

    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 transition py-2 px-3 rounded-lg
      ${
        location.pathname === to
          ? 'text-green-600 bg-green-50'
          : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'
      }`}
    >

      <Icon size={20} />

      <span>{label}</span>

    </Link>
  );

  // MOBILE QUICK ICON
  const MobileIconLink = ({
    to,
    icon: Icon
  }) => (

    <Link
      to={to}
      className={`p-2 rounded-lg transition
      ${
        location.pathname === to
          ? 'text-green-600 bg-green-50'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >

      <Icon size={20} />

    </Link>
  );

  return (

    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">

      <div className="container mx-auto px-3 py-3 max-w-7xl">

        <div className="flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-2">

            {/* LOGO */}
            <Link
              to="/"
              className="flex items-center gap-2"
            >

              <img
                src={logo}
                alt="Onlibry"
                className="h-8 w-auto"
              />

              <span className="text-xl font-bold text-green-600 hidden sm:inline">
                Onlibry
              </span>

            </Link>

          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1">

            <NavLink
              to="/"
              icon={Home}
              label="Home"
            />

            <NavLink
              to="/files"
              icon={SquareLibrary}
              label="Files"
            />

            <NavLink
              to="/folders"
              icon={Folder}
              label="Folders"
            />

            <NavLink
              to="/mock-tests"
              icon={SquarePen}
              label="Mock Tests"
            />

            <NavLink
              to="/quizzes"
              icon={NotebookPen}
              label="Quiz"
            />

            {user && (
              <NavLink
                to="/saved-files"
                icon={Bookmark}
                label="Saved"
              />
            )}

            <NavLink
              to="/pricing"
              icon={CreditCard}
              label="Pricing"
            />

          </nav>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-1">

            {/* MOBILE QUICK NAV */}
            <div className="md:hidden flex items-center gap-0.5">

              <MobileIconLink
                to="/files"
                icon={SquareLibrary}
              />

              <MobileIconLink
                to="/folders"
                icon={Folder}
              />

              <MobileIconLink
                to="/mock-tests"
                icon={SquarePen}
              />

              <MobileIconLink
                to="/quizzes"
                icon={NotebookPen}
              />

            </div>

            {/* CART */}
            <Link
              to="/pricing"
              state={{ activeTab: 'cart' }}
              className={`relative p-2 rounded-lg transition
              ${
                location.pathname === '/pricing'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >

              <ShoppingCart size={20} />

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

            {/* DESKTOP AUTH */}
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

                    <LogOut
                      size={20}
                      className="text-red-500"
                    />

                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
                >

                  <LogIn
                    size={20}
                    className="text-white"
                  />

                </button>
              )}

            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition
              ${
                mobileMenuOpen
                  ? 'text-green-600 bg-green-50'
                  : 'hover:bg-gray-100'
              }`}
            >

              {mobileMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}

            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (

          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">

            <nav className="flex flex-col gap-1">

              <NavLink
                to="/"
                icon={Home}
                label="Home"
                onClick={() => setMobileMenuOpen(false)}
              />

              {user && (
                <NavLink
                  to="/saved-files"
                  icon={Bookmark}
                  label="Saved Files"
                  onClick={() => setMobileMenuOpen(false)}
                />
              )}

              <NavLink
                to="/pricing"
                icon={CreditCard}
                label="Pricing"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* AUTH */}
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
                    className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg transition"
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