// src/components/FileCard.jsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { saveFile, unsaveFile, isFileSaved, canAccessFile } from '../services/fileService';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BookOpenText, ShoppingCart, Trash2, Star, Bookmark, Lock, Unlock } from 'lucide-react';

const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;

function FileCard({ file }) {
  const { user, isSubscribed } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  const checkPurchasedFile = async (userId, fileId) => {
    if (!userId) return false;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const purchasedFiles = userDoc.data()?.purchasedFiles || [];
      return purchasedFiles.includes(fileId);
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        try {
          const saved = await isFileSaved(file.id);
          setIsSaved(saved);
          const purchased = await checkPurchasedFile(user.uid, file.id);
          setIsPurchased(purchased);
        } catch (error) {
          console.error('Error checking status:', error);
        } finally {
          setCheckingPurchase(false);
        }
      } else {
        setCheckingPurchase(false);
      }
      setInCart(isInCart(file.id));
    };
    checkStatus();
  }, [file.id, user]);

  const handleView = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    navigate(`/viewer/${file.id}`);
  };

  const handleSample = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files', fileId: file.id } } });
      return;
    }
    navigate(`/viewer/${file.id}?preview=true`);
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

  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/files' } } });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await unsaveFile(file.id);
        setIsSaved(false);
      } else {
        await saveFile(file.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getButtons = () => {
    if (!user) {
      return { type: 'view', actions: [{ icon: BookOpenText, onClick: handleView, label: 'View' }] };
    }
    if (isSubscribed || isPurchased || !file.isPremium) {
      return { type: 'view', actions: [{ icon: BookOpenText, onClick: handleView, label: 'View' }] };
    }
    return {
      type: 'premium',
      actions: [
        { icon: BookOpenText, onClick: handleSample, label: 'Sample' },
        { icon: ShoppingCart, onClick: inCart ? handleRemoveFromCart : handleAddToCart, label: inCart ? 'Remove' : 'Cart' },
        { icon: Lock, onClick: handleSubscribe, label: 'Subscribe' }
      ]
    };
  };

  const buttons = getButtons();

  const renderTags = () => {
    let tags = file.tagsList || [];
    if (tags.length === 0 && file.tagsString) {
      tags = file.tagsString.split(',').slice(0, 2);
    }
    if (tags.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.slice(0, 2).map((tag, idx) => (
          <span key={idx} className="px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-500 rounded-full truncate max-w-[80px]">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  if (checkingPurchase && user && file.isPremium && !isSubscribed) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-200">
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 flex-1">{file.name}</h3>
          <span className={`ml-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-full whitespace-nowrap ${file.isPremium ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {file.isPremium ? `₹${file.price || 29}` : 'Free'}
          </span>
        </div>

        {renderTags()}

        <div className="flex gap-1.5 mt-2">
          {buttons.actions.map((btn, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
              className="flex-1 py-1.5 rounded-lg text-white text-xs font-medium transition flex items-center justify-center gap-1"
              style={{ backgroundColor: btn.label === 'Subscribe' ? '#f59e0b' : '#22c55e' }}
            >
              <btn.icon size={14} />
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
          <button
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`px-2 py-1.5 rounded-lg transition flex items-center justify-center ${isSaved ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {isSaving ? <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : (isSaved ? <Star size={14} fill="currentColor" /> : <Bookmark size={14} />)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileCard;