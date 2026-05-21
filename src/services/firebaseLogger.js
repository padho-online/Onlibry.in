// DEPRECATED: This file is no longer used for logging.
// Please use loggerService.js instead.
// All logs now go to VITE_LOGS_SHEET_API_URL
// ✅ CORRECTED URL - Make sure this is exactly your deployed URL
const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyHujfaaRZTsH6FBKplt4EdpURVrLPC-Efrd1gaQ-NqGQydfhMloAGsnHAaKSdgj0w/exec';

// Send data to Google Sheet
async function sendToSheet(action, data) {
  try {
    console.log(`📤 Sending to sheet: ${action}`);
    console.log(`📤 Data:`, JSON.stringify(data));
    
    // Use fetch with proper options
    const response = await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: action, 
        ...data,
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`✅ Sent to sheet: ${action}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending to sheet:', error);
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
    console.log('IP fetch failed, using unknown');
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
  console.log(`📌 logSavedFileToSheet called: ${action} - ${fileName} - User: ${userEmail || 'guest'}`);
  
  const ipAddress = await getClientIP();
  const deviceId = getDeviceId();
  const userAgent = navigator.userAgent;
  
  const payload = {
    action: action,
    userId: userId || null,
    userEmail: userEmail || null,
    userDisplayName: displayName || null,
    fileId: fileId,
    fileName: fileName,
    ipAddress: ipAddress,
    deviceId: deviceId,
    userAgent: userAgent
  };
  
  console.log('📤 Full payload being sent:', JSON.stringify(payload, null, 2));
  
  const result = await sendToSheet('savedFile', payload);
  return result;
}

// Log File View with duration
export async function logFileViewToSheet(fileId, fileName, fileType, durationSeconds, viewStatus, userId, userEmail, isPremium, hasAccess) {
  const deviceId = getDeviceId();
  const userAgent = navigator.userAgent;
  
  await sendToSheet('fileView', {
    userId: userId || null,
    userEmail: userEmail || null,
    fileId: fileId,
    fileName: fileName,
    fileType: fileType,
    viewStatus: viewStatus,
    durationSeconds: durationSeconds,
    durationFormatted: formatDuration(durationSeconds),
    isPremium: isPremium || false,
    hasAccess: hasAccess || false,
    deviceId: deviceId,
    userAgent: userAgent
  });
}

// Log User Login
export async function logUserLoginToSheet(userId, userEmail, displayName, isSubscribed) {
  const ipAddress = await getClientIP();
  const deviceId = getDeviceId();
  const userAgent = navigator.userAgent;
  
  await sendToSheet('userLogin', {
    userId: userId,
    userEmail: userEmail,
    displayName: displayName,
    eventType: 'login',
    isSubscribed: isSubscribed || false,
    ipAddress: ipAddress,
    deviceId: deviceId,
    userAgent: userAgent
  });
}

// Helper: Format duration
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}