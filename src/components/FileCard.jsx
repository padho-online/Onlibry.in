// src/components/FileCard.jsx
// FIXED - Save button working in single click

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { saveFile, unsaveFile, isFileSaved, canAccessFile } from '../services/fileService';
import SampleViewer from './SampleViewer';

function FileCard({ file }) {
  const { user, isSubscribed } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  
  const [isSaved, setIsSaved] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        try {
          const saved = await isFileSaved(file.id);
          setIsSaved(saved);
          const access = await canAccessFile(file.id);
          setCanAccess(access);
        } catch (error) {
          console.error('Error checking status:', error);
        }
      } else {
        setCanAccess(false);
      }
      setInCart(isInCart(file.id));
    };
    checkStatus();
  }, [file.id, user, file.isPremium]);

  const handleViewFullFile = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    navigate(`/viewer/${file.id}`);
  };

  const handleViewSample = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    setShowSample(true);
  };

  const handleSubscribe = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    addToCart({
      id: file.id,
      name: file.name,
      price: file.price || 29,
      type: 'file',
      originalName: file.name,
      cloudflareKey: file.cloudflareKey || file.id
    });
    navigate('/pricing', { state: { activeTab: 'cart' } });
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    addToCart({
      id: file.id,
      name: file.name,
      price: file.price || 29,
      type: 'file',
      originalName: file.name,
      cloudflareKey: file.cloudflareKey || file.id
    });
    setInCart(true);
  };

  const handleRemoveFromCart = () => {
    removeFromCart(file.id);
    setInCart(false);
  };

  // 🔥 FIXED: Save button - single click working
  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files' } } });
      return;
    }
    
    // Prevent multiple clicks while saving
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      if (isSaved) {
        console.log('📌 Unsaving file:', file.name);
        const result = await unsaveFile(file.id);
        if (result.success) {
          setIsSaved(false);
          console.log('✅ File unsaved successfully');
        } else {
          console.error('❌ Unsave failed:', result.error);
        }
      } else {
        console.log('📌 Saving file:', file.name);
        const result = await saveFile(file.id);
        if (result.success) {
          setIsSaved(true);
          console.log('✅ File saved successfully');
        } else {
          console.error('❌ Save failed:', result.error);
        }
      }
    } catch (error) {
      console.error('❌ Save toggle error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // RENDER TAGS
  // ============================================
  const renderTags = () => {
    let tagsArray = file.tagsList || [];
    
    if (tagsArray.length === 0 && file.tagsString) {
      tagsArray = file.tagsString.split(',').map(t => t.trim()).filter(t => t);
    }
    
    if (tagsArray.length === 0 && file.tags && typeof file.tags === 'object') {
      Object.values(file.tags).forEach(values => {
        if (Array.isArray(values)) tagsArray.push(...values);
        else if (typeof values === 'string') tagsArray.push(values);
      });
    }
    
    if (tagsArray.length === 0) return null;
    
    const uniqueTags = [...new Set(tagsArray)];
    
    return (
      <div className="flex flex-wrap gap-1.5 mb-2">
        {uniqueTags.slice(0, 4).map((tag, idx) => (
          <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {tag.length > 20 ? tag.substring(0, 17) + '...' : tag}
          </span>
        ))}
      </div>
    );
  };

  const getButtonConfig = () => {
    if (!user) {
      return { showView: true, showSubscribe: false, showSample: false, showAddToCart: false, showSave: false, viewText: 'View', viewAction: handleViewFullFile, viewColor: 'bg-green-600' };
    }
    
    if (!isSubscribed) {
      if (!file.isPremium) {
        return { showView: true, showSubscribe: false, showSample: false, showAddToCart: false, showSave: true, viewText: '📖 View', viewAction: handleViewFullFile, viewColor: 'bg-green-600' };
      }
      return { showView: false, showSubscribe: true, showSample: true, showAddToCart: !inCart, showRemoveFromCart: inCart, showSave: false, subscribeText: `🔒 Subscribe ₹${file.price || 29}`, subscribeAction: handleSubscribe, sampleAction: handleViewSample, addToCartAction: handleAddToCart, removeFromCartAction: handleRemoveFromCart };
    }
    
    return { showView: true, showSubscribe: false, showSample: false, showAddToCart: false, showSave: true, viewText: '📖 View Full', viewAction: handleViewFullFile, viewColor: 'bg-green-600' };
  };

  const buttonConfig = getButtonConfig();

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex justify-end mb-1">
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${file.isPremium ? 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/50' : 'text-green-700 bg-green-100 dark:bg-green-900/50'}`}>
              {file.isPremium ? `₹${file.price || 29}` : 'Free'}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2 mb-1">
            {file.name}
          </h3>

          {renderTags()}

          {file.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {file.description}
            </p>
          )}

          <div className="flex-1"></div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {buttonConfig.showView && (
              <button onClick={buttonConfig.viewAction} className={`flex-1 px-2 py-1.5 ${buttonConfig.viewColor} hover:opacity-90 text-white text-xs font-medium rounded-lg transition`}>
                {buttonConfig.viewText}
              </button>
            )}
            {buttonConfig.showSubscribe && (
              <button onClick={buttonConfig.subscribeAction} className="flex-1 px-2 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition">
                {buttonConfig.subscribeText}
              </button>
            )}
            {buttonConfig.showSample && (
              <button onClick={buttonConfig.sampleAction} className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition" title="View Sample">
                🔍
              </button>
            )}
            {buttonConfig.showAddToCart && (
              <button onClick={buttonConfig.addToCartAction} className="px-2 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition" title="Add to Cart">
                🛒
              </button>
            )}
            {buttonConfig.showRemoveFromCart && (
              <button onClick={buttonConfig.removeFromCartAction} className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition" title="Remove from Cart">
                🗑️
              </button>
            )}
            {buttonConfig.showSave && (
              <button
                onClick={handleSaveToggle}
                disabled={isSaving}
                className={`px-2 py-1.5 rounded-lg transition text-xs flex items-center justify-center min-w-[32px] ${
                  isSaved 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                title={isSaved ? 'Saved' : 'Save for later'}
              >
                {isSaving ? '⏳' : (isSaved ? '⭐' : '📌')}
              </button>
            )}
          </div>
        </div>
      </div>

      {showSample && (
        <SampleViewer
          fileUrl={`https://onlibry.mdhabibul12212141.workers.dev/${encodeURIComponent(file.cloudflareKey || file.id)}`}
          fileName={file.name}
          fileId={file.id}
          filePrice={file.price}
          onClose={() => setShowSample(false)}
        />
      )}
    </>
  );
}

export default FileCard;