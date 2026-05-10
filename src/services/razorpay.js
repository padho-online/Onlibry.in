// src/services/razorpay.js
// Razorpay service - Real order creation (No mock)

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SiS2QOdZl6zCUx';

// Load Razorpay script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create order from backend API
export const createRazorpayOrder = async (amount, currency = 'INR') => {
  try {
    console.log('📦 Creating order for amount:', amount);
    
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });

    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error('API response error:', text);
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }

    // Parse JSON
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    console.log('✅ Order created:', data.id);
    
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error) {
    console.error('❌ Order creation failed:', error);
    throw error;
  }
};

// Open Razorpay modal for subscription
export const openRazorpayModal = async (options) => {
  const { amount, planName, user, onSuccess, onFailure, onModalClose } = options;
  
  try {
    // Create real order from backend
    const order = await createRazorpayOrder(amount);
    
    const rzpOptions = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Onlibry',
      description: `${planName} Subscription`,
      image: 'https://onlibry.in/logo transparent.png',
      order_id: order.id,
      handler: async (response) => {
        // Payment successful
        const paymentData = {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          amount: amount,
          plan: planName,
          userId: user?.uid,
          userEmail: user?.email,
          status: 'success',
          timestamp: new Date().toISOString()
        };
        
        if (onSuccess) {
          onSuccess(paymentData);
        }
      },
      prefill: {
        name: user?.displayName || '',
        email: user?.email || '',
      },
      theme: {
        color: '#22c55e',
      },
      modal: {
        ondismiss: () => {
          if (onModalClose) {
            onModalClose();
          }
          if (onFailure) {
            onFailure('Payment cancelled');
          }
        }
      }
    };
    
    const rzp = new window.Razorpay(rzpOptions);
    rzp.open();
    return rzp;
    
  } catch (error) {
    console.error('Failed to open Razorpay:', error);
    if (onFailure) {
      onFailure(error.message);
    }
    throw error;
  }
};

// Open Razorpay modal for single file purchase
export const openFilePurchaseModal = async (options) => {
  const { amount, fileName, fileId, user, onSuccess, onFailure } = options;
  
  try {
    // Create real order from backend
    const order = await createRazorpayOrder(amount);
    
    const rzpOptions = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Onlibry',
      description: `Purchase: ${fileName}`,
      image: 'https://onlibry.in/logo transparent.png',
      order_id: order.id,
      handler: async (response) => {
        const purchaseData = {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: amount,
          fileId: fileId,
          fileName: fileName,
          userId: user?.uid,
          userEmail: user?.email,
          type: 'single_file',
          timestamp: new Date().toISOString()
        };
        
        if (onSuccess) {
          onSuccess(purchaseData);
        }
      },
      prefill: {
        name: user?.displayName || '',
        email: user?.email || '',
      },
      theme: {
        color: '#22c55e',
      },
      modal: {
        ondismiss: () => {
          if (onFailure) onFailure('Purchase cancelled');
        }
      }
    };
    
    const rzp = new window.Razorpay(rzpOptions);
    rzp.open();
    return rzp;
    
  } catch (error) {
    console.error('Failed to open Razorpay:', error);
    if (onFailure) {
      onFailure(error.message);
    }
    throw error;
  }
};

// Log payment event to Google Sheets
export async function logPaymentEvent(eventData) {
  try {
    const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;
    if (SHEET_API_URL) {
      await fetch(SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'paymentLog', ...eventData })
      });
    }
    console.log('Payment event logged:', eventData.event);
  } catch (error) {
    console.error('Payment logging failed:', error);
  }
}