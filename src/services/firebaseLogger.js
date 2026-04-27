// Firebase to Sheets Logger - Direct logging from Firebase

// ⚠️ IMPORTANT: Is URL ko apne deployed Google Apps Script URL se replace karein
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzLNJnj4MSuREQ9K_ZloTip7D_UuC1SQAYg1bYXz5O1m2v_lJnn_1F7ydsqWlr96R12og/exec';

// Send data to Google Sheet
async function sendToSheet(action, data) {
  try {
    // Use fetch with keepalive for reliable delivery
    const response = await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
      keepalive: true
    });
    console.log(`✅ Sent to sheet: ${action}`);
    return true;
  } catch (error) {
    console.error('Error sending to sheet:', error);
    return false;
  }
}

// Get client IP address
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
}

// Get or create device ID
function getDeviceId() {
  let deviceId = localStorage.getItem('onlibry_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('onlibry_deviceId', deviceId);
  }
  return deviceId;
}

// Log Saved File (called from fileService.js)
export async function logSavedFileToSheet(fileId, fileName, action, userId, userEmail, displayName) {
  const ipAddress = await getClientIP();
  const deviceId = getDeviceId();
  
  console.log(`📌 Logging saved file to sheet: ${action} - ${fileName} - ${userEmail}`);
  
  await sendToSheet('savedFile', {
    userId: userId,
    userEmail: userEmail,
    displayName: displayName,
    fileId: fileId,
    fileName: fileName,
    action: action,
    ipAddress: ipAddress,
    deviceId: deviceId,
    timestamp: new Date().toISOString()
  });
}

// Log File View with duration
export async function logFileViewToSheet(fileId, fileName, fileType, durationSeconds, viewStatus, userId, userEmail, isPremium, hasAccess) {
  const deviceId = getDeviceId();
  
  await sendToSheet('fileView', {
    userId: userId,
    userEmail: userEmail,
    fileId: fileId,
    fileName: fileName,
    fileType: fileType,
    viewStatus: viewStatus,
    durationSeconds: durationSeconds,
    durationFormatted: formatDuration(durationSeconds),
    isPremium: isPremium,
    hasAccess: hasAccess,
    deviceId: deviceId,
    timestamp: new Date().toISOString()
  });
}

// Log User Login
export async function logUserLoginToSheet(userId, userEmail, displayName, isSubscribed) {
  const ipAddress = await getClientIP();
  const deviceId = getDeviceId();
  
  await sendToSheet('userLogin', {
    userId: userId,
    userEmail: userEmail,
    displayName: displayName,
    eventType: 'login',
    isSubscribed: isSubscribed,
    ipAddress: ipAddress,
    deviceId: deviceId,
    timestamp: new Date().toISOString()
  });
}

// Log Payment
export async function logPaymentToSheet(event, plan, amount, status, userId, userEmail, paymentId = null, orderId = null, error = null) {
  const deviceId = getDeviceId();
  
  await sendToSheet('paymentLog', {
    userId: userId,
    userEmail: userEmail,
    event: event,
    plan: plan,
    amount: amount,
    status: status,
    paymentId: paymentId,
    orderId: orderId,
    error: error,
    deviceId: deviceId,
    timestamp: new Date().toISOString()
  });
}

// Helper: Format duration
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}