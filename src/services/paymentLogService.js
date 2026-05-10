// src/services/paymentLogService.js
// Payment logging service using Google Sheet (Pure JavaScript - No JSX)

const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;

// Get client IP
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
}

// Send to Google Sheet
async function sendToSheet(action, data) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data, timestamp: new Date().toISOString() })
    });
    return true;
  } catch (error) {
    console.error('Error logging payment:', error);
    return false;
  }
}

// Log payment initiation
export async function logPaymentInitiation(userId, userEmail, planName, amount) {
  return await sendToSheet('paymentLog', {
    userId: userId || 'guest',
    userEmail: userEmail || 'guest',
    event: 'payment_initiated',
    plan: planName,
    amount: amount || 0,
    status: 'pending',
    ipAddress: await getClientIP()
  });
}

// Log payment success
export async function logPaymentSuccess(userId, userEmail, planName, amount, paymentId, orderId) {
  return await sendToSheet('paymentLog', {
    userId: userId || 'guest',
    userEmail: userEmail || 'guest',
    event: 'payment_success',
    plan: planName,
    amount: amount || 0,
    paymentId: paymentId || 'N/A',
    orderId: orderId || 'N/A',
    status: 'success',
    ipAddress: await getClientIP()
  });
}

// Log payment failure
export async function logPaymentFailure(userId, userEmail, planName, amount, errorMessage) {
  return await sendToSheet('paymentLog', {
    userId: userId || 'guest',
    userEmail: userEmail || 'guest',
    event: 'payment_failed',
    plan: planName,
    amount: amount || 0,
    error: errorMessage || 'Unknown error',
    status: 'failed',
    ipAddress: await getClientIP()
  });
}

// Log modal close (user cancelled)
export async function logPaymentModalClose(userId, userEmail, planName, amount) {
  return await sendToSheet('paymentLog', {
    userId: userId || 'guest',
    userEmail: userEmail || 'guest',
    event: 'payment_modal_closed',
    plan: planName,
    amount: amount || 0,
    status: 'cancelled',
    ipAddress: await getClientIP()
  });
}

// Get all payment logs (from Google Sheet - via API call)
export async function getAllPaymentLogs(limitCount = 100) {
  try {
    const response = await fetch(`${SHEET_API_URL}?action=getPaymentLogs&limit=${limitCount}`);
    const data = await response.json();
    
    if (data.success && data.logs) {
      return data.logs;
    }
    return [];
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return [];
  }
}

// Get payment logs for a specific user
export async function getUserPaymentLogs(userId) {
  try {
    const response = await fetch(`${SHEET_API_URL}?action=getUserPaymentLogs&userId=${userId}`);
    const data = await response.json();
    
    if (data.success && data.logs) {
      return data.logs;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user payment logs:', error);
    return [];
  }
}