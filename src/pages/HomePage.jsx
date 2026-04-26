import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
          Welcome to{' '}
          <span className="text-green-600 dark:text-green-400">Onlibry</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Your one-stop platform for educational resources, mock tests, and study materials
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/files"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Browse Files
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3 border-2 border-green-600 text-green-600 dark:text-green-400 rounded-lg font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition"
          >
            View Plans
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl my-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Why Choose Onlibry?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Access thousands of educational resources at your fingertips
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">10,000+ Resources</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Books, PYQs, notes, and more</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Mock Tests</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Practice with real exam patterns</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Save & Organize</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Bookmark your favorite files</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;