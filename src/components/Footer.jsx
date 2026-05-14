// src/components/Footer.jsx - Using react-icons for social icons
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Folder, 
  SquarePen, 
   NotebookPen, 
  CreditCard, 
  Mail, 
  Shield, 
  MessageSquareHeart
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaTelegram, FaTwitter, FaWhatsapp, FaYoutube } from 'react-icons/fa';

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
              <li><Link to="/mock-tests" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><SquarePen size={11} /> Mock Tests</Link></li>
              <li><Link to="/quizzes" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><NotebookPen size={11} /> Quiz</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Support</h3>
            <ul className="space-y-1.5">
              <li><a href="/info/contact" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Mail size={11} /> Contact</a></li>
              <li><a href="/info/privacy" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><Shield size={11} /> Privacy</a></li>
              <li><a href="/info/feedback" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><MessageSquareHeart size={11} /> Feedback</a></li>
              <li><Link to="/pricing" className="text-[11px] text-gray-500 hover:text-green-600 flex items-center gap-1"><CreditCard size={11} /> Pricing</Link></li>
            </ul>
          </div>

          {/* Follow Us */} 
          <div>
            <h3 className="text-xs font-semibold text-gray-800 mb-2">Follow</h3>
            <div className="flex gap-3">
              <a href="https://chat.whatsapp.com/CoSssFN5KtLEKLxCCafQAV" className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-100 transition">
                <FaWhatsapp size={14} className="text-gray-600" />
              </a>
              <a href="https://t.me/onlibry" className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-100 transition">
                <FaTelegram size={14} className="text-gray-600" />
              </a>
              <a href="https://www.instagram.com/onlibry_xyz" className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-100 transition">
                <FaInstagram size={14} className="text-gray-600" />
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
            <a href="/info/terms" className="text-[10px] text-gray-400 hover:text-green-600">Terms</a>
            <a href="/info/privacy" className="text-[10px] text-gray-400 hover:text-green-600">Privacy</a>
            <a href="/info/feedback" className="text-[10px] text-gray-400 hover:text-green-600">Feedback</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;