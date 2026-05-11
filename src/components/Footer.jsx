// src/components/Footer.jsx - Using react-icons for social icons
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Folder, 
  FileQuestion, 
  HelpCircle, 
  CreditCard, 
  Mail, 
  Shield, 
  Coffee 
} from 'lucide-react';
import { FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-5 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-sm font-bold text-green-600 mb-2">Onlibry</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Your one-stop platform for educational resources, mock tests, and study materials.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Explore</h3>
            <ul className="space-y-1.5">
              <li><Link to="/" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Home size={11} /> Home</Link></li>
              <li><Link to="/files" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><FileText size={11} /> Files</Link></li>
              <li><Link to="/folders" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Folder size={11} /> Folders</Link></li>
              <li><Link to="/mock-tests" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><FileQuestion size={11} /> Mock Tests</Link></li>
              <li><Link to="/quizzes" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><HelpCircle size={11} /> Quiz</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Support</h3>
            <ul className="space-y-1.5">
              <li><a href="https://onlibry.in/feedback.html" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Mail size={11} /> Contact</a></li>
              <li><a href="https://onlibry.in/privacy.html" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Shield size={11} /> Privacy</a></li>
              <li><a href="https://onlibry.in/Buycoffee.html" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Coffee size={11} /> Support Us</a></li>
              <li><Link to="/pricing" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><CreditCard size={11} /> Pricing</Link></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Follow</h3>
            <div className="flex gap-3">
              <a href="#" className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-100 transition">
                <FaFacebook size={14} className="text-gray-600" />
              </a>
              <a href="#" className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-100 transition">
                <FaTwitter size={14} className="text-gray-600" />
              </a>
              <a href="#" className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-100 transition">
                <FaYoutube size={14} className="text-gray-600" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[10px] text-gray-400">
            © {new Date().getFullYear()} Onlibry. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-[10px] text-gray-400 hover:text-green-600">Terms</a>
            <a href="#" className="text-[10px] text-gray-400 hover:text-green-600">Privacy</a>
            <a href="#" className="text-[10px] text-gray-400 hover:text-green-600">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;