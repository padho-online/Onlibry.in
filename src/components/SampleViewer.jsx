// src/components/SampleViewer.jsx
// FINAL - No URL reveal, fetches PDF directly

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const WORKER_URL = 'https://onlibry.mdhabibul12212141.workers.dev';

function SampleViewer({ fileName, fileId, filePrice, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleViewSample = async () => {
    setLoading(true);
    try {
      // Fetch PDF from worker (URL hidden)
      const response = await fetch(`${WORKER_URL}/sample/${fileId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      window.open(url, '_blank');
      // Clean up after opening
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Error loading sample:', error);
      alert('Failed to load sample. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseFull = () => {
    onClose();
    if (!user) {
      navigate('/login', { state: { from: '/files', fileId: fileId } });
      return;
    }
    addToCart({
      id: fileId,
      name: fileName,
      price: filePrice || 29,
      type: 'file',
      originalName: fileName,
      cloudflareKey: fileId
    });
    navigate('/pricing', { state: { activeTab: 'cart' } });
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: '/files', fileId: fileId } });
      return;
    }
    addToCart({
      id: fileId,
      name: fileName,
      price: filePrice || 29,
      type: 'file',
      originalName: fileName,
      cloudflareKey: fileId
    });
    onClose();
    alert(`✅ "${fileName}" added to cart!`);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Sample Preview
            </h3>
            <p className="text-sm text-gray-500">
              {fileName} - <span className="text-yellow-600">First 3 pages only</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-8 text-center">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click below to view sample preview (opens in new tab)
          </p>
          <button
            onClick={handleViewSample}
            disabled={loading}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔍 Open Sample PDF'}
          </button>
          <p className="text-xs text-gray-400 mt-4">
            This is a preview showing only first 3 pages.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            🛒 Add to Cart (₹{filePrice || 29})
          </button>
          <button
            onClick={handlePurchaseFull}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Purchase Full Version
          </button>
        </div>
      </div>
    </div>
  );
}

export default SampleViewer;