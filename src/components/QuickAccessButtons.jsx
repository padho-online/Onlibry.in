// src/components/QuickAccessButtons.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuickAccessButtons } from '../services/quickAccessService';

function QuickAccessButtons() {
  const [buttons, setButtons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadButtons();
  }, []);

  const loadButtons = async () => {
    setLoading(true);
    const data = await getQuickAccessButtons();
    setButtons(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 animate-pulse h-20"></div>
        ))}
      </div>
    );
  }

  if (buttons.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
      {buttons.map((btn) => (
        <Link
          key={btn.id}
          to={btn.path}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 text-center hover:shadow-lg transition border border-gray-200 dark:border-gray-700 group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
            {btn.icon}
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {btn.label}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default QuickAccessButtons;