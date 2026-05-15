// src/services/paymentLogService.js
// Payment logging service - Saves to Firestore (for admin panel) + Google Sheet

import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

// 🔥 Save to Firestore (for admin panel)
async function saveToFirestore(logData) {
  try {
    const docRef = await addDoc(collection(db, 'paymentLogs'), {
      ...logData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    console.log('✅ Payment log saved to Firestore:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firestore error:', error);
    return false;
  }
}

// Send to Google Sheet (backup)
async function sendToSheet(data) {
  if (!SHEET_API_URL) return false;
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'paymentLog', ...data, timestamp: new Date().toISOString() })
    });
    return true;
  } catch (error) {
    console.error('Sheet error:', error);
    return false;
  }
}

// Main log function
async function logPayment(event, userId, userEmail, planName, amount, status, paymentId = null, orderId = null, error = null) {
  const ipAddress = await getClientIP();
  
  const logData = {
    event: event,
    userId: userId || 'guest',
    userEmail: userEmail || 'guest',
    plan: planName,
    amount: amount || 0,
    status: status,
    paymentId: paymentId || 'N/A',
    orderId: orderId || 'N/A',
    error: error || '',
    ipAddress: ipAddress,
    userAgent: navigator.userAgent
  };
  
  // Save to Firestore (for admin panel display)
  await saveToFirestore(logData);
  
  // Also send to Google Sheet (backup)
  await sendToSheet(logData);
  
  return true;
}

export async function logPaymentInitiation(userId, userEmail, planName, amount) {
  return await logPayment('payment_initiated', userId, userEmail, planName, amount, 'pending');
}

export async function logPaymentSuccess(userId, userEmail, planName, amount, paymentId, orderId) {
  return await logPayment('payment_success', userId, userEmail, planName, amount, 'success', paymentId, orderId);
}

export async function logPaymentFailure(userId, userEmail, planName, amount, errorMessage) {
  return await logPayment('payment_failed', userId, userEmail, planName, amount, 'failed', null, null, errorMessage);
}

export async function logPaymentModalClose(userId, userEmail, planName, amount) {
  return await logPayment('payment_cancelled', userId, userEmail, planName, amount, 'cancelled');
}

export async function getAllPaymentLogs(limitCount = 100) {
  try {
    const response = await fetch(`${SHEET_API_URL}?action=getPaymentLogs&limit=${limitCount}`);
    const data = await response.json();
    if (data.success && data.logs) return data.logs;
    return [];
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
}

export async function getUserPaymentLogs(userId) {
  try {
    const response = await fetch(`${SHEET_API_URL}?action=getUserPaymentLogs&userId=${userId}`);
    const data = await response.json();
    if (data.success && data.logs) return data.logs;
    return [];
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return [];
  }
}