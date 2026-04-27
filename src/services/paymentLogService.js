import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';

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

// Log payment initiation
export async function logPaymentInitiation(userId, userEmail, planName, amount) {
  try {
    const docRef = await addDoc(collection(db, 'paymentLogs'), {
      userId: userId || 'guest',
      userEmail: userEmail || 'guest',
      event: 'payment_initiated',
      plan: planName,
      amount: amount || 0,
      status: 'pending',
      timestamp: serverTimestamp(),
      ipAddress: await getClientIP()
    });
    console.log('✅ Payment initiation logged:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error logging payment initiation:', error);
    return null;
  }
}

// Log payment success
export async function logPaymentSuccess(userId, userEmail, planName, amount, paymentId, orderId) {
  try {
    const docRef = await addDoc(collection(db, 'paymentLogs'), {
      userId: userId || 'guest',
      userEmail: userEmail || 'guest',
      event: 'payment_success',
      plan: planName,
      amount: amount || 0,
      paymentId: paymentId || 'N/A',
      orderId: orderId || 'N/A',
      status: 'success',
      timestamp: serverTimestamp(),
      ipAddress: await getClientIP()
    });
    console.log('✅ Payment success logged:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error logging payment success:', error);
    return null;
  }
}

// Log payment failure
export async function logPaymentFailure(userId, userEmail, planName, amount, errorMessage) {
  try {
    const docRef = await addDoc(collection(db, 'paymentLogs'), {
      userId: userId || 'guest',
      userEmail: userEmail || 'guest',
      event: 'payment_failed',
      plan: planName,
      amount: amount || 0,
      error: errorMessage || 'Unknown error',
      status: 'failed',
      timestamp: serverTimestamp(),
      ipAddress: await getClientIP()
    });
    console.log('✅ Payment failure logged:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error logging payment failure:', error);
    return null;
  }
}

// Log modal close (user cancelled)
export async function logPaymentModalClose(userId, userEmail, planName, amount) {
  try {
    const docRef = await addDoc(collection(db, 'paymentLogs'), {
      userId: userId || 'guest',
      userEmail: userEmail || 'guest',
      event: 'payment_modal_closed',
      plan: planName,
      amount: amount || 0,
      status: 'cancelled',
      timestamp: serverTimestamp(),
      ipAddress: await getClientIP()
    });
    console.log('✅ Payment cancellation logged:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error logging payment cancellation:', error);
    return null;
  }
}

// Get all payment logs (admin only)
export async function getAllPaymentLogs(limitCount = 100) {
  try {
    const logsQuery = query(
      collection(db, 'paymentLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(logsQuery);
    const logs = [];
    querySnapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return [];
  }
}

// Get payment logs for a specific user
export async function getUserPaymentLogs(userId) {
  try {
    const logsQuery = query(
      collection(db, 'paymentLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(logsQuery);
    const logs = [];
    querySnapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching user payment logs:', error);
    return [];
  }
}