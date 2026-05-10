// server.js - Local development server for Razorpay API
import express from 'express';
import Razorpay from 'razorpay';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_SiS2QOdZl6zCUx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '3akTUrS9604ASY0afBzEhGny',
});

// Create Order API
app.post('/api/create-order', async (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  
  console.log('📦 Creating order for amount:', amount);
  
  try {
    const options = {
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };
    
    const order = await razorpay.orders.create(options);
    console.log('✅ Order created:', order.id);
    
    res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('❌ Order creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});