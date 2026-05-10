// src/services/razorpay.js
const RAZORPAY_KEY_ID = 'rzp_live_SiS2QOdZl6zCUx';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (amount, currency = 'INR') => {
  try {
    console.log('📡 Creating order for amount:', amount);
    
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });

    const data = await response.json();
    console.log('📡 Order API response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
    };
  } catch (error) {
    console.error('❌ Order creation failed:', error);
    throw new Error('Unable to initiate payment. Please try again.');
  }
};