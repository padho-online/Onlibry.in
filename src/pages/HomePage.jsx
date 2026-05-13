// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import QuickAccessButtons from '../components/QuickAccessButtons';
import NotificationSection from '../components/NotificationSection';
import NotificationSlider from '../components/NotificationSlider';
import { FileText, CreditCard, BookOpen, SquarePen, TrendingUp, Shield, Zap } from 'lucide-react';

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-4 md:py-8 max-w-7xl mx-auto px-4">

      {/* 🎠 CARDS SLIDER - Dynamic from Admin */}
      <NotificationSlider />
      
      {/* 🔥 QUICK ACCESS BUTTONS - Dynamic from Admin */}
      <QuickAccessButtons />

        {/* Hero Section */}
      <section className="text-center py-8 md:py-12">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
          Welcome to{' '}
          <span className="text-green-600">Onlibry</span>
        </h1>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto mb-6">
          Your one-stop platform for educational resources, mock tests, and study materials
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/files"
            className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <FileText size={16} /> Browse Files
          </Link>
          <Link
            to="/pricing"
            className="px-5 py-2 border-2 border-green-600 text-green-600 rounded-lg font-medium text-sm hover:bg-green-50 transition flex items-center justify-center gap-2"
          >
            <CreditCard size={16} /> View Plans
          </Link>
        </div>
      </section>

      

      {/* 📢 NOTIFICATIONS SECTION - Dynamic from Admin */}
      <NotificationSection />

    


      {/* Features Section */}
      <section className="py-6">
        <h2 className="text-lg md:text-2xl font-bold text-center text-gray-800 mb-5">Why Choose Onlibry?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-800">10,000+ Resources</h3>
            <p className="text-[10px] text-gray-500">Books, PYQs, notes</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <SquarePen size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-800">Mock Tests</h3>
            <p className="text-[10px] text-gray-500">Real exam patterns</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-800">Track Progress</h3>
            <p className="text-[10px] text-gray-500">Monitor your growth</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield size={20} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-800">Secure Access</h3>
            <p className="text-[10px] text-gray-500">Your data is safe</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="mt-6 p-5 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl text-center">
          <h3 className="font-bold text-gray-800 mb-2">Ready to start learning?</h3>
          <p className="text-xs text-gray-500 mb-4">Join thousands of students already using Onlibry</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
            Get Started <Zap size={14} />
          </Link>
        </section>
      )}
    </div>
  );
}

export default HomePage;