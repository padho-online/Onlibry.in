// api/razorpay-webhook.mjs
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let body = '';
    await new Promise((resolve) => {
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => resolve());
    });

    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    console.log(`Webhook received: ${event}`);

    switch (event) {
      case 'payment.captured':
        const payment = payload.payload.payment.entity;
        console.log(`Payment captured: ${payment.id}, Order: ${payment.order_id}, Amount: ₹${payment.amount / 100}`);
        break;
      case 'payment.failed':
        console.log('Payment failed:', payload.payload.payment.entity);
        break;
      case 'order.paid':
        console.log('Order paid:', payload.payload.order.entity);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}