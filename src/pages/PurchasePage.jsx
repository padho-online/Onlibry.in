import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFileById, purchaseFile } from '../services/fileService';
import { loadRazorpayScript, createRazorpayOrder, logPaymentEvent } from '../services/razorpay';

function PurchasePage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFileDetails();
  }, [fileId]);

  const loadFileDetails = async () => {
    setLoading(true);
    try {
      const fileData = await getFileById(fileId);
      if (!fileData) {
        setError('File not found');
      } else {
        setFile(fileData);
      }
    } catch (err) {
      setError('Failed to load file details');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/purchase/${fileId}` } });
      return;
    }

    if (isSubscribed) {
      alert('You already have an active subscription! You can access all premium files.');
      navigate('/files');
      return;
    }

    setProcessing(true);
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Payment gateway failed to load');
      }

      const amount = file.price || 29;
      
      // Log payment initiation
      await logPaymentEvent({
        event: 'single_file_payment_initiated',
        userId: user.uid,
        userEmail: user.email,
        fileName: file.name,
        fileId: file.id,
        amount: amount,
        timestamp: new Date().toISOString()
      });

      // Create Razorpay order
      const order = await createRazorpayOrder(amount);
      
      const options = {
        key: 'rzp_live_Si2m5d0A3VdWrR', // Your Razorpay key
        amount: amount * 100,
        currency: 'INR',
        name: 'Onlibry',
        description: `Purchase: ${file.name}`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          // Payment success
          await purchaseFile(file.id);
          
          await logPaymentEvent({
            event: 'single_file_payment_success',
            userId: user.uid,
            userEmail: user.email,
            fileName: file.name,
            fileId: file.id,
            amount: amount,
            paymentId: response.razorpay_payment_id,
            timestamp: new Date().toISOString()
          });
          
          alert(`Successfully purchased "${file.name}"! 🎉`);
          navigate('/files');
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#22c55e',
        },
        modal: {
          ondismiss: () => {
            logPaymentEvent({
              event: 'single_file_payment_cancelled',
              userId: user.uid,
              userEmail: user.email,
              fileName: file.name,
              fileId: file.id,
              amount: amount,
              timestamp: new Date().toISOString()
            });
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">{error || 'File not found'}</h2>
        <button onClick={() => navigate('/files')} className="px-4 py-2 bg-green-600 text-white rounded">
          Browse Files
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
          <p className="opacity-90 mt-1">Get lifetime access to this file</p>
        </div>
        
        {/* File Details */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📄</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{file.name}</h2>
              {file.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{file.description}</p>
              )}
              <div className="flex gap-2 mt-3">
                {file.tags?.subject?.slice(0, 2).map((tag, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Price Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Price</span>
            <span className="text-3xl font-bold text-gray-800 dark:text-white">₹{file.price || 29}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">One-time payment • Lifetime access</p>
        </div>
        
        {/* Benefits */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">What you get:</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">✓ Lifetime access to this file</li>
            <li className="flex items-center gap-2">✓ Read online anytime</li>
            <li className="flex items-center gap-2">✓ No subscription needed</li>
            <li className="flex items-center gap-2">✓ Secure payment</li>
          </ul>
        </div>
        
        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
          <button
            onClick={handlePurchase}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {processing ? 'Processing...' : `Pay ₹${file.price || 29}`}
          </button>
          <button
            onClick={() => navigate('/files')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchasePage;