// api/create-order.js
// Vercel Serverless Function for Razorpay Order Creation

const Razorpay = require('razorpay');

// Allow CORS for all origins
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Initialize Razorpay with environment variables
    const razorpay = new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    console.log('Creating order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Order created:', order.id);

    return res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    });
  }
}

module.exports = allowCors(handler);