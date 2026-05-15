import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Oops! Page not found.
      </p>
      
      <Link
        to="/"
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
      >
        Go Back Home
      </Link>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
      </p>
      
      <Link
        to="/info/feedback"
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
      >
        Report Us through feedback
      </Link>
    </div>
  );
}

export default NotFoundPage;