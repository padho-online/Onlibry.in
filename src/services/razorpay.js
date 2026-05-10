// src/services/razorpay.js
// Razorpay service - Direct order creation (no backend API)

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SiS2QOdZl6zCUx';

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

// Direct order creation using Razorpay checkout (no backend call)
export const createRazorpayOrder = async (amount, currency = 'INR') => {
  // Return mock order object (Razorpay will handle actual payment)
  return {
    id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    amount: amount * 100,
    currency: currency
  };
};

export const openRazorpayModal = async (options) => {
  const { amount, planName, user, onSuccess, onFailure, onModalClose } = options;
  
  // Create a mock order
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
};

// For file purchase
export const openFilePurchaseModal = async (options) => {
  const { amount, fileName, fileId, user, onSuccess, onFailure } = options;
  
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
};

// Log payment event to Google Sheets
export async function logPaymentEvent(eventData) {
  try {
    const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'paymentLog', ...eventData })
    });
    console.log('Payment event logged:', eventData.event);
  } catch (error) {
    console.error('Payment logging failed:', error);
  }
}