// src/components/QuickAccessButtons.jsx - D1 Database Version
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuickAccessFromD1 } from '../services/d1Service';
import { getIconComponent } from './IconPicker';

function QuickAccessButtons() {
  const [buttons, setButtons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadButtons();
  }, []);

  const loadButtons = async () => {
    setLoading(true);
    const data = await getQuickAccessFromD1();
    setButtons(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-200 rounded-xl p-4 animate-pulse h-20"></div>
        ))}
      </div>
    );
  }

  if (buttons.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 mb-8">
      {buttons.map((btn) => {
        const IconComponent = getIconComponent(btn.icon);
        return (
          <Link
            key={btn.id}
            to={btn.path}
            className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition border border-gray-200 group"
          >
            <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
              <IconComponent size={28} className="text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-700">
              {btn.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default QuickAccessButtons;