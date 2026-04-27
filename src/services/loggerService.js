// Google Sheets Web App URL (Replace with your deployed URL)
const LOGGER_API_URL = 'https://script.google.com/macros/s/AKfycbwjpb6PYaZ3HOwiFVF4nU-QUexsfaf5NHd4tfrAM4dJ_kfSaZHNEsygJ6EF16g8LK9qZw/exec';

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

// Get device ID from localStorage or generate new
function getDeviceId() {
  let deviceId = localStorage.getItem('onlibry_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('onlibry_deviceId', deviceId);
  }
  return deviceId;
}

// Send log to Google Sheets
async function sendLog(action, data) {
  try {
    const ipAddress = await getClientIP();
    const deviceId = getDeviceId();
    
    const payload = {
      action: action,
      ...data,
      ipAddress: ipAddress,
      deviceId: deviceId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Use sendBeacon for page unload events, fetch for others
    if (action === 'pageView' && document.visibilityState === 'hidden') {
      navigator.sendBeacon(LOGGER_API_URL, JSON.stringify(payload));
    } else {
      await fetch(LOGGER_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    
    console.log(`Logged: ${action}`);
  } catch (error) {
    console.error('Logging error:', error);
  }
}

// 1. Log Page View
export function logPageView(pageUrl, pageTitle) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  sendLog('pageView', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    pageUrl: pageUrl,
    pageTitle: pageTitle,
    referrer: document.referrer || ''
  });
}

// 2. Log File View
export function logFileView(fileId, fileName, isPremium, hasAccess) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  sendLog('fileView', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    fileId: fileId,
    fileName: fileName,
    fileType: fileName?.split('.').pop() || 'unknown',
    isPremium: isPremium,
    hasAccess: hasAccess
  });
}

// 3. Log User Login (Logged in users details)
export function logUserLogin(user) {
  if (!user) return;
  
  // Get subscription status from localStorage or check
  const isSubscribed = localStorage.getItem('isSubscribed') === 'true';
  
  sendLog('userLogin', {
    userId: user.uid,
    userEmail: user.email,
    displayName: user.displayName || user.email?.split('@')[0],
    isSubscribed: isSubscribed
  });
}

// 4. Log Saved File Action
export function logSavedFile(fileId, fileName, action) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  sendLog('savedFile', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    fileId: fileId,
    fileName: fileName,
    action: action // 'save' or 'unsave'
  });
}

// 5. Log Search Query
export function logSearch(searchQuery, resultsCount, isExactSearch = false) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  sendLog('searchLog', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    searchQuery: searchQuery,
    resultsCount: resultsCount,
    isExactSearch: isExactSearch
  });
}

// 6. Log Mock Test Result
export function logMockTestResult(resultData) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const percentage = ((resultData.correct / resultData.totalQuestions) * 100).toFixed(2);
  
  sendLog('mockTestResult', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    testName: resultData.testName,
    totalQuestions: resultData.totalQuestions,
    correct: resultData.correct,
    incorrect: resultData.incorrect,
    unanswered: resultData.unanswered,
    score: resultData.score,
    timeTaken: resultData.timeTaken,
    percentage: percentage
  });
}

// 7. Log Quiz Result
export function logQuizResult(resultData) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const percentage = ((resultData.correct / resultData.totalQuestions) * 100).toFixed(2);
  
  sendLog('quizResult', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    quizName: resultData.quizName,
    totalQuestions: resultData.totalQuestions,
    correct: resultData.correct,
    incorrect: resultData.incorrect,
    unanswered: resultData.unanswered,
    score: resultData.score,
    timeTaken: resultData.timeTaken,
    percentage: percentage
  });
}

// 8. Log Payment
export function logPayment(event, plan, amount, status, paymentId = null, orderId = null, error = null) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  sendLog('paymentLog', {
    userId: user?.uid || null,
    userEmail: user?.email || null,
    event: event,
    plan: plan,
    amount: amount,
    status: status,
    paymentId: paymentId,
    orderId: orderId,
    error: error
  });
}

// Initialize page view logging
export function initPageViewLogger() {
  // Log initial page view
  logPageView(window.location.href, document.title);
  
  // Log on page visibility change (when user leaves)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logPageView(window.location.href, document.title);
    }
  });
  
  // Log on beforeunload
  window.addEventListener('beforeunload', () => {
    logPageView(window.location.href, document.title);
  });
}