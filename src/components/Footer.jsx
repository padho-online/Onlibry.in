import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Onlibry</h3>
            <p className="text-sm text-gray-400">
              Your one-stop platform for educational resources, mock tests, and study materials.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-gray-400 hover:text-green-400 transition">Home</Link></li>
              <li><Link to="/files" className="text-gray-400 hover:text-green-400 transition">All Files</Link></li>
              <li><Link to="/mock-tests" className="text-gray-400 hover:text-green-400 transition">Mock Tests</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-green-400 transition">Pricing</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://onlibry.in/feedback.html" className="text-gray-400 hover:text-green-400 transition">Contact Us</a></li>
              <li><a href="https://onlibry.in/privacy.html" className="text-gray-400 hover:text-green-400 transition">Privacy Policy</a></li>
              <li><a href="https://onlibry.in/Buycoffee.html" className="text-gray-400 hover:text-green-400 transition">Support Us</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-green-400 transition">📘</a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition">🐦</a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition">📺</a>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              © 2026 Onlibry. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;