// Razorpay service for payment integration
import { logPaymentInitiation, logPaymentSuccess, logPaymentFailure, logPaymentModalClose } from './paymentLogService';

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


// Get from: https://dashboard.razorpay.com/app/keys
const RAZORPAY_KEY_ID = 'rzp_live_Si2m5d0A3VdWrR'; 

export const createRazorpayOrder = async (amount, currency = 'INR') => {
  // For production, this should call your backend
  // For now, create a mock order
  return {
    id: 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    amount: amount * 100,
    currency: currency
  };
};

export const openRazorpayModal = async (options) => {
  const { amount, planName, user, onSuccess, onFailure, onModalClose } = options;
  
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
      // Payment success
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

// For single file purchase
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