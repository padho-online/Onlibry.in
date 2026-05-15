// src/Info/InfoHub.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaShieldAlt, FaFileAlt, FaEnvelope, FaCommentDots, FaStar, 
  FaArrowLeft, FaPhone, FaMapMarkerAlt, FaClock, FaGlobe, FaCheckCircle,
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube,
  FaExclamationTriangle, FaHome, FaUser,
  FaTelegram, FaWhatsapp,
  FaInfoCircle  
} from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';

function InfoHub() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(tab || 'privacy');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [userType, setUserType] = useState('student');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const GOOGLE_FORM_ACTION = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdqFiGJ1I4gaZbGxjyAYZhSKMMfI7PzU7QuxNpYonz0L555vw/formResponse";

  const FORM_ENTRIES = {
    name: "entry.1998705546",
    email: "entry.405192546",
    userType: "entry.604599872",
    feedbackType: "entry.598220544",
    message: "entry.993894101"
  };

  // Update active tab when URL param changes
  useEffect(() => {
  if (tab && ['about', 'privacy', 'terms', 'contact', 'feedback'].includes(tab)) {
    setActiveTab(tab);
  } else if (!tab) {
    setActiveTab('about');  // Default 'about' kar do
  }
}, [tab]);

  // Auto-fill user info if logged in
  useEffect(() => {
    if (user) {
      setName(user.displayName || user.email?.split('@')[0] || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/info/${newTab}`);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (feedbackRating === 0) {
      setFeedbackError('Please select a rating');
      return;
    }
    
    if (!feedbackText.trim()) {
      setFeedbackError('Please enter your feedback');
      return;
    }
    
    if (!name.trim()) {
      setFeedbackError('Please enter your name');
      return;
    }
    
    setFeedbackLoading(true);
    setFeedbackError('');
    
    try {
      // Create form data for Google Forms
      const formData = new FormData();
      formData.append(FORM_ENTRIES.name, name);
      formData.append(FORM_ENTRIES.email, email);
      formData.append(FORM_ENTRIES.userType, userType);
      formData.append(FORM_ENTRIES.feedbackType, feedbackType);
      formData.append(FORM_ENTRIES.message, `${feedbackText}\n\n--- Rating: ${feedbackRating} stars ---`);
      
      // Submit to Google Forms
      await fetch(GOOGLE_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
      // Also send to sheet API
      const sheetApiUrl = import.meta.env.VITE_SHEET_API_URL;
      if (sheetApiUrl) {
        await fetch(sheetApiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'feedback',
            rating: feedbackRating,
            feedback: feedbackText,
            name: name,
            email: email,
            userType: userType,
            feedbackType: feedbackType,
            userId: user?.uid || 'guest',
            timestamp: new Date().toISOString()
          })
        });
      }
      
      setFeedbackSubmitted(true);
      setFeedbackRating(0);
      setFeedbackText('');
      setName('');
      setEmail('');
      setUserType('student');
      setFeedbackType('suggestion');
      
      setTimeout(() => {
        setFeedbackSubmitted(false);
      }, 3000);
      
    } catch (err) {
      console.error('Feedback error:', err);
      setFeedbackError('Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const tabs = [
  { id: 'about', label: 'About Us', icon: FaInfoCircle, path: '/info/about' },
  { id: 'privacy', label: 'Privacy Policy', icon: FaShieldAlt, path: '/info/privacy' },
  { id: 'terms', label: 'Terms & Conditions', icon: FaFileAlt, path: '/info/terms' },
  { id: 'contact', label: 'Contact Us', icon: FaEnvelope, path: '/info/contact' },
  { id: 'feedback', label: 'Feedback', icon: FaCommentDots, path: '/info/feedback' }
];

  return (
    <div className="py-6 md:py-10 max-w-6xl mx-auto px-4">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 mb-6 text-sm">
        <FaArrowLeft size={14} /> Back to Home
      </Link>

      {/* Header */}
<div className="text-center mb-8">
  <div className="flex items-center justify-center gap-3 mb-2">
    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
      <FaHome size={32} className="text-green-600" />
    </div>
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Help & Information Center</h1>
  </div>
  <p className="text-sm text-gray-500">Privacy policy, terms, contact info & feedback</p>
</div>

            {/* Tabs with Links - Horizontal Scrollable for Mobile */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-thin">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          const isActive = activeTab === tabItem.id;
          return (
            <Link
              key={tabItem.id}
              to={tabItem.path}
              onClick={() => handleTabChange(tabItem.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              {tabItem.label}
            </Link>
          );
        })}
      </div>

  {/* ============================================ */}
{/* ABOUT US TAB */}
{/* ============================================ */}
{activeTab === 'about' && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
      <FaInfoCircle size={28} className="text-green-600" />
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">About Onlibry</h2>
    </div>
    
    <div className="space-y-6">
      {/* Mission Section */}
      <section>
        <h3 className="text-lg font-semibold text-green-600 mb-2">Our Mission</h3>
        <p className="text-gray-600 leading-relaxed">
          Onlibry's mission is to provide every student with free, quality educational materials. 
          We believe that money should never be a barrier to learning and education.
        </p>
      </section>

      {/* What We Offer */}
      <section>
        <h3 className="text-lg font-semibold text-green-600 mb-2">What We Offer</h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start gap-2">
            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={14} />
            <span>📚 <strong>10,000+ Study Materials</strong> - Books, PYQs, Notes</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={14} />
            <span>✏️ <strong>Mock Tests</strong> - Real exam pattern practice</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={14} />
            <span>❓ <strong>Quizzes</strong> - Test your knowledge</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={14} />
            <span>📁 <strong>Organized Folders</strong> - Easy navigation</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={14} />
            <span>🔒 <strong>Secure Access</strong> - Your data is safe with us</span>
          </li>
        </ul>
      </section>

      {/* Our Story */}
      <section>
        <h3 className="text-lg font-semibold text-green-600 mb-2">Our Story</h3>
        <p className="text-gray-600 leading-relaxed">
          Onlibry was created by a group of passionate educators and developers. We noticed that 
          many students lack access to quality study materials or cannot afford expensive courses. 
          That's why we built Onlibry - a free digital library where any student can find the 
          resources they need for their studies.
        </p>
      </section>

      {/* Our Team */}
      <section>
        <h3 className="text-lg font-semibold text-green-600 mb-2">Our Team</h3>
        <p className="text-gray-600 leading-relaxed">
          We are a small but dedicated team constantly working to improve the website and add 
          new materials. If you'd like to contribute or have any suggestions, please feel free 
          to reach out to us.
        </p>
      </section>

      {/* Why Onlibry */}
      <section>
        <h3 className="text-lg font-semibold text-green-600 mb-2">Why Choose Onlibry?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">💰</div>
            <p className="font-medium text-gray-800">100% Free</p>
            <p className="text-xs text-gray-500">No hidden charges</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📱</div>
            <p className="font-medium text-gray-800">Mobile Friendly</p>
            <p className="text-xs text-gray-500">Learn on the go</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🔄</div>
            <p className="font-medium text-gray-800">Regular Updates</p>
            <p className="text-xs text-gray-500">New content added daily</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">👥</div>
            <p className="font-medium text-gray-800">Community Support</p>
            <p className="text-xs text-gray-500">Active Telegram & WhatsApp groups</p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-green-50 rounded-lg p-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Have Questions?</h3>
        <p className="text-sm text-gray-600 mb-3">
          We'd love to hear from you. Feel free to reach out to us.
        </p>
        <Link 
          to="/info/contact" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
          onClick={() => handleTabChange('contact')}
        >
          <FaEnvelope size={14} />
          Contact Us
        </Link>
      </section>
    </div>
  </div>
)}

      {/* ============================================ */}
      {/* PRIVACY POLICY TAB */}
      {/* ============================================ */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <FaShieldAlt size={28} className="text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Privacy Policy</h2>
          </div>
          
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Information We Collect</h3>
              <p className="text-gray-600 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, 
                save files, or contact us. This may include your name, email address, and any other 
                information you choose to provide.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Information</h3>
              <p className="text-gray-600 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, 
                to process your transactions, to communicate with you, and to protect against fraud 
                and abuse.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Sharing of Information</h3>
              <p className="text-gray-600 leading-relaxed">
                We do not share your personal information with third parties except as necessary to 
                provide our services (e.g., payment processing), to comply with the law, or to protect 
                our rights.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Data Security</h3>
              <p className="text-gray-600 leading-relaxed">
                We take reasonable measures to protect your personal information from loss, theft, 
                misuse, and unauthorized access. However, no internet transmission is completely secure.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Your Rights</h3>
              <p className="text-gray-600 leading-relaxed">
                You may access, update, or delete your account information at any time by logging 
                into your account settings. You may also contact us for assistance.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Contact Us</h3>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:eduweb0123@gmail.com?subject=Hello&body=I%20want%20to%20contact%20you." className="text-green-600 hover:underline">eduweb0123@gmail.com</a>
              </p>
            </section>

            <div className="pt-4 text-center text-sm text-gray-400 border-t border-gray-200">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TERMS & CONDITIONS TAB */}
      {/* ============================================ */}
      {activeTab === 'terms' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <FaFileAlt size={28} className="text-green-600" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Terms & Conditions</h2>
          </div>
          
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Onlibry, you agree to be bound by these Terms & Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2. User Accounts</h3>
              <p className="text-gray-600 leading-relaxed">
                To access certain features, you must create an account. You are responsible for 
                maintaining the confidentiality of your account and for all activities that occur 
                under your account.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Subscription & Payments</h3>
              <p className="text-gray-600 leading-relaxed">
                Some features require a paid subscription. By purchasing a subscription, you agree 
                to pay the applicable fees. Subscriptions auto-renew unless cancelled before the 
                renewal date.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Intellectual Property</h3>
              <p className="text-gray-600 leading-relaxed">
                All content on Onlibry, including text, graphics, logos, and software, is the property 
                of Onlibry or its content suppliers and is protected by copyright laws.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Prohibited Conduct</h3>
              <p className="text-gray-600 leading-relaxed">
                You may not use our services for any illegal purpose, to distribute malware, to harass 
                others, or to infringe on intellectual property rights.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Termination</h3>
              <p className="text-gray-600 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct 
                that violates these terms or is harmful to other users.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">7. Limitation of Liability</h3>
              <p className="text-gray-600 leading-relaxed">
                Onlibry shall not be liable for any indirect, incidental, or consequential damages 
                arising from your use of our services.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">8. Changes to Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                We may modify these terms at any time. Continued use of our services after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <div className="pt-4 text-center text-sm text-gray-400 border-t border-gray-200">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CONTACT US TAB */}
      {/* ============================================ */}
      {activeTab === 'contact' && (
        <div>
          {/* Contact Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Email Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaEnvelope size={28} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Us</h3>
              <p className="text-sm text-gray-500 mb-3">For general inquiries & support</p>
              <a href="mailto:eduweb0123@gmail.com?subject=Hello&body=I%20want%20to%20contact%20you." className="text-green-600 hover:underline font-medium">
                eduweb0123@gmail.com
              </a>
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaWhatsapp size={28} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Message Us</h3>
              <p className="text-sm text-gray-500 mb-3">Mon-Fri, 10 AM - 6 PM</p>
              <a href="https://api.whatsapp.com/send?phone=918985363932&text=Hi%2C%20I%27m%20an%20Onlibry%20user%20I%20want%20to%20contact%20you." className="text-green-600 hover:underline font-medium">
                Only Whatsapp
              </a>
            </div>
          </div>

          {/* Office Address
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaMapMarkerAlt size={28} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Office Address</h3>
                <p className="text-gray-600 leading-relaxed">
                  Onlibry Educational Services,<br />
                  123, Knowledge Park,<br />
                  Hyderabad - 500001,<br />
                  Telangana, India
                </p>
              </div>
            </div>
          </div> */}

          {/* Business Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaClock size={28} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Business Hours</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Monday - Friday:</span>
                  <span className="text-gray-800">01:00 PM - 6:00 PM</span>
                  <span className="text-gray-600">Saturday:</span>
                  <span className="text-gray-800">01:00 PM - 6:00 PM</span>
                  <span className="text-gray-600">Sunday:</span>
                  <span className="text-gray-800">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaGlobe size={28} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Join our community groups</h3>
                <div className="flex flex-wrap gap-4 mt-2">
                  <a href="https://t.me/onlibry" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
                    <FaTelegram size={18} /> Telegram
                  </a>
                  <a href="https://chat.whatsapp.com/CoSssFN5KtLEKLxCCafQAV" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
                    <FaWhatsapp size={18} /> Whatsapp
                  </a>
                  <a href="https://www.instagram.com/onlibry_xyz" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
                    <FaInstagram size={18} /> Instagram
                  </a>
                  {/* <a href="https://www.linkedin.com/in/habibul-mohammed-b29a4537a/" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
                    <FaLinkedin size={18} /> LinkedIn
                  </a> */}
                  {/* <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
                    <FaYoutube size={18} /> YouTube
                  </a> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* FEEDBACK TAB */}
      {/* ============================================ */}
      {activeTab === 'feedback' && (
        <div>
          {feedbackSubmitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <FaCheckCircle size={20} className="text-green-600" />
              <p className="text-green-700">Thank you for your feedback! We appreciate your input.</p>
            </div>
          )}

          {feedbackError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <FaExclamationTriangle size={20} className="text-red-600" />
              <p className="text-red-700 text-sm">{feedbackError}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <FaCommentDots size={28} className="text-green-600" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Share Your Feedback</h2>
            </div>

            <form onSubmit={handleFeedbackSubmit}>
              {/* Rating Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate your experience? *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      onMouseEnter={() => setFeedbackHoverRating(star)}
                      onMouseLeave={() => setFeedbackHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <FaStar
                        size={32}
                        className={`transition ${
                          (feedbackHoverRating || feedbackRating) >= star
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        style={((feedbackHoverRating || feedbackRating) >= star) ? { fill: '#facc15' } : {}}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {feedbackRating === 1 && '⭐ Poor'}
                  {feedbackRating === 2 && '⭐⭐ Fair'}
                  {feedbackRating === 3 && '⭐⭐⭐ Good'}
                  {feedbackRating === 4 && '⭐⭐⭐⭐ Very Good'}
                  {feedbackRating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                </p>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <FaUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <div className="relative">
                  <FaEnvelope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* User Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a *
                </label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>

              {/* Feedback Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Type *
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                  required
                >
                  <option value="suggestion">Suggestion</option>
                  <option value="issue">Issue / Problem</option>
                  <option value="praise">Praise / Compliment</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message *
                </label>
                <textarea
                  rows="5"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you like, what we can improve, or report any issues..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={feedbackLoading}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {feedbackLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend size={18} />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Coffee Support
          <div className="mt-8 text-center">
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">☕ Support Our Work</h3>
              <p className="text-sm text-gray-600 mb-3">
                If you like our work and want to keep Onlibry free, consider supporting us.
              </p>
              <a 
                href="https://onlibry.in/Buycoffee.html" 
                target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
              >
                ☕ Buy us a Coffee
              </a>
            </div>
          </div> */}

          <p className="text-center text-xs text-gray-400 mt-6">
            Your feedback helps us serve you better. We read every submission.
          </p>
        </div>
      )}
    </div>
  );
}

export default InfoHub;