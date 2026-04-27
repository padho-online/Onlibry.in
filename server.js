// server.js - Simple test server for API
const express = require('express');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/api/create-order', async (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));