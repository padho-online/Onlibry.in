// ============================================
// ONLIBRY SECURE CLOUD FUNCTIONS (v2)
// ============================================
// Using Secret Manager for Service Account
// No sensitive data in code - GitHub safe
// ============================================

const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// ============================================
// SECRET MANAGER CONFIGURATION
// ============================================
// Service account JSON stored securely in Secret Manager
const googleServiceAccountSecret = defineSecret('GOOGLE_SERVICE_ACCOUNT');

// ============================================
// LAZY INITIALIZATION - Admin SDK only once
// ============================================
let adminInitialized = false;
let authClient = null;
let driveService = null;

// Initialize Admin SDK if not already
function getAdmin() {
  if (!adminInitialized) {
    admin.initializeApp();
    adminInitialized = true;
  }
  return admin;
}

// Get Firestore instance
function getDb() {
  return getAdmin().firestore();
}

// ============================================
// LAZY INITIALIZATION - Google Drive Client
// ============================================
async function getDriveClient() {
  if (driveService && authClient) {
    return driveService;
  }
  
  try {
    // Get service account JSON from Secret Manager
    const secretValue = googleServiceAccountSecret.value();
    const serviceAccount = JSON.parse(secretValue);
    
    // Create JWT auth client
    authClient = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/drive.readonly']
    );
    
    driveService = google.drive({ version: 'v3', auth: authClient });
    
    console.log('✅ Google Drive client initialized');
    return driveService;
    
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error);
    throw new Error('Drive service unavailable');
  }
}

// ============================================
// HELPER: Check if user has active subscription
// ============================================
async function hasActiveSubscription(userId) {
  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data();
    const subscription = userData.subscription || {};
    
    if (!subscription.isActive) return false;
    if (!subscription.endDate) return false;
    
    const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
    
    return endDate > new Date();
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// ============================================
// HELPER: Check if user purchased a specific file
// ============================================
async function hasPurchasedFile(userId, fileId) {
  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    
    const purchasedFiles = userDoc.data().purchasedFiles || [];
    return purchasedFiles.includes(fileId);
    
  } catch (error) {
    return false;
  }
}

// ============================================
// HELPER: Check if user is admin
// ============================================
async function isAdminUser(userId) {
  try {
    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return false;
    
    return userDoc.data().isAdmin === true;
    
  } catch (error) {
    return false;
  }
}

// ============================================
// FUNCTION 1: SECURE FILE DOWNLOAD
// ============================================
exports.downloadFile = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: ['http://localhost:5173', 'https://onlibry.in', 'https://onlibry-react.vercel.app'],
    minInstances: 0,
  },
  async (request) => {
    // 1. Authentication check
    if (!request.auth) {
      throw new Error('unauthenticated: You must be logged in to download files');
    }

    const userId = request.auth.uid;
    const { fileId } = request.data;

    if (!fileId) {
      throw new Error('invalid-argument: File ID is required');
    }

    try {
      const db = getDb();
      
      // 2. Check subscription
      const hasAccess = await hasActiveSubscription(userId) || await hasPurchasedFile(userId, fileId);
      
      if (!hasAccess) {
        throw new Error('permission-denied: You need an active subscription to download this file');
      }

      // 3. Get file metadata
      const fileDoc = await db.collection('files').doc(fileId).get();
      
      if (!fileDoc.exists) {
        throw new Error('not-found: File not found');
      }

      const fileData = fileDoc.data();
      const driveFileId = fileData.driveFileId || fileId;

      // 4. Log download
      await db.collection('downloadLogs').add({
        userId: userId,
        userEmail: request.auth.token.email || '',
        fileId: fileId,
        fileName: fileData.name || 'Unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: request.rawRequest?.ip || 'unknown',
      });

      // 5. Get Google Drive client and file info
      const drive = await getDriveClient();
      const driveResponse = await drive.files.get({
        fileId: driveFileId,
        fields: 'name,size,mimeType',
      });

      // Return file info for streaming
      return {
        success: true,
        fileName: driveResponse.data.name || fileData.name,
        mimeType: driveResponse.data.mimeType || 'application/octet-stream',
        size: driveResponse.data.size || 0,
        driveFileId: driveFileId,
      };

    } catch (error) {
      console.error('Download error:', error);
      throw new Error(`internal: ${error.message}`);
    }
  }
);

// ============================================
// FUNCTION 2: CHECK SUBSCRIPTION STATUS
// ============================================
exports.checkSubscription = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      return { isSubscribed: false, subscriptionType: null, expiresAt: null };
    }

    const userId = request.auth.uid;
    
    try {
      const db = getDb();
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return { isSubscribed: false, subscriptionType: null, expiresAt: null };
      }

      const userData = userDoc.data();
      const subscription = userData.subscription || {};
      const isActive = subscription.isActive === true;
      
      let isValid = false;
      let expiresAt = null;
      
      if (isActive && subscription.endDate) {
        const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
        expiresAt = endDate.toISOString();
        if (endDate > new Date()) {
          isValid = true;
        }
      }

      return {
        isSubscribed: isValid,
        subscriptionType: subscription.type || null,
        expiresAt: expiresAt,
      };
      
    } catch (error) {
      console.error('Check subscription error:', error);
      return { isSubscribed: false, subscriptionType: null, expiresAt: null };
    }
  }
);

// ============================================
// FUNCTION 3: GET SUBSCRIPTION PLANS
// ============================================
exports.getPlans = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    try {
      const db = getDb();
      const plansRef = db.collection('config').doc('plans');
      const plansDoc = await plansRef.get();
      
      if (plansDoc.exists) {
        return { success: true, plans: plansDoc.data() };
      }
      
      // Default plans
      const defaultPlans = {
        free: { name: 'FREE', price: 0, period: 'lifetime', enabled: true, features: [
          'Access to free books',
          'Selected PYQs',
          'Limited daily searches',
          'Ads enabled',
          'Online reading only'
        ]},
        monthly: { name: 'PRO MONTHLY', price: 99, period: 'month', enabled: true, features: [
          'Access to all premium files',
          'Unlimited online reading',
          'Unlimited downloads',
          'Ad-free experience',
          'Full video access',
          'Mock tests included',
          'Priority support'
        ]},
        yearly: { name: 'PRO ANNUAL', price: 499, period: 'year', enabled: true, features: [
          'All Pro Monthly features',
          'Best value (Save ₹689/year)',
          'Premium badge',
          'Early access to new features',
          'Priority support + dedicated email'
        ]}
      };
      
      return { success: true, plans: defaultPlans };
      
    } catch (error) {
      console.error('Get plans error:', error);
      return { success: false, error: error.message, plans: {} };
    }
  }
);

// ============================================
// FUNCTION 4: GET ALL FILES (Paginated)
// ============================================
exports.getAllFiles = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    try {
      const { pageSize = 50, lastDocId = null } = request.data;
      const db = getDb();
      
      let filesQuery = db.collection('files')
        .where('showOnWebsite', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(pageSize);
      
      if (lastDocId) {
        const lastDoc = await db.collection('files').doc(lastDocId).get();
        if (lastDoc.exists) {
          filesQuery = filesQuery.startAfter(lastDoc);
        }
      }
      
      const snapshot = await filesQuery.get();
      const files = [];
      
      snapshot.forEach(doc => {
        const fileData = doc.data();
        files.push({
          id: doc.id,
          name: fileData.name,
          description: fileData.description || '',
          isPremium: fileData.isPremium || false,
          price: fileData.price || 29,
          tags: fileData.tags || {},
          showOnWebsite: fileData.showOnWebsite || false,
        });
      });
      
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastId = lastVisible ? lastVisible.id : null;
      
      return {
        success: true,
        files: files,
        lastId: lastId,
        hasMore: snapshot.docs.length === pageSize
      };
      
    } catch (error) {
      console.error('Get files error:', error);
      return { success: false, error: error.message, files: [] };
    }
  }
);

// ============================================
// FUNCTION 5: UPDATE SUBSCRIPTION (Admin Only)
// ============================================
exports.updateSubscription = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new Error('unauthenticated: Authentication required');
    }
    
    const isAdmin = await isAdminUser(request.auth.uid);
    if (!isAdmin) {
      throw new Error('permission-denied: Admin access required');
    }
    
    const { userId, planType, durationDays, isActive } = request.data;
    
    if (!userId) {
      throw new Error('invalid-argument: User ID required');
    }
    
    try {
      const db = getDb();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (durationDays || 30));
      
      await db.collection('users').doc(userId).update({
        subscription: {
          type: planType || 'monthly',
          isActive: isActive !== undefined ? isActive : true,
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: endDate.toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Update subscription error:', error);
      throw new Error(`internal: ${error.message}`);
    }
  }
);

// ============================================
// FUNCTION 6: GET DOWNLOAD LOGS (Admin Only)
// ============================================
exports.getDownloadLogs = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new Error('unauthenticated: Authentication required');
    }
    
    const isAdmin = await isAdminUser(request.auth.uid);
    if (!isAdmin) {
      throw new Error('permission-denied: Admin access required');
    }
    
    const { limit = 100, startAfter = null } = request.data;
    
    try {
      const db = getDb();
      let logsQuery = db.collection('downloadLogs')
        .orderBy('timestamp', 'desc')
        .limit(limit);
      
      if (startAfter) {
        const lastDoc = await db.collection('downloadLogs').doc(startAfter).get();
        if (lastDoc.exists) {
          logsQuery = logsQuery.startAfter(lastDoc);
        }
      }
      
      const snapshot = await logsQuery.get();
      const logs = [];
      
      snapshot.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
        });
      });
      
      return { success: true, logs: logs };
      
    } catch (error) {
      console.error('Get logs error:', error);
      return { success: false, error: error.message, logs: [] };
    }
  }
);

// ============================================
// FUNCTION 7: CREATE/UPDATE PLAN (Admin Only)
// ============================================
exports.createPlan = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new Error('unauthenticated: Authentication required');
    }
    
    const isAdmin = await isAdminUser(request.auth.uid);
    if (!isAdmin) {
      throw new Error('permission-denied: Admin access required');
    }
    
    const { planKey, planData } = request.data;
    
    if (!planKey || !planData) {
      throw new Error('invalid-argument: Plan key and data required');
    }
    
    try {
      const db = getDb();
      const plansRef = db.collection('config').doc('plans');
      const plansDoc = await plansRef.get();
      const currentPlans = plansDoc.exists ? plansDoc.data() : {};
      
      currentPlans[planKey] = planData;
      
      await plansRef.set(currentPlans);
      
      return { success: true };
      
    } catch (error) {
      console.error('Create plan error:', error);
      throw new Error(`internal: ${error.message}`);
    }
  }
);

// ============================================
// FUNCTION 8: DELETE FILE (Admin Only)
// ============================================
exports.deleteFile = onCall(
  { 
    secrets: [googleServiceAccountSecret],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new Error('unauthenticated: Authentication required');
    }
    
    const isAdmin = await isAdminUser(request.auth.uid);
    if (!isAdmin) {
      throw new Error('permission-denied: Admin access required');
    }
    
    const { fileId } = request.data;
    
    if (!fileId) {
      throw new Error('invalid-argument: File ID required');
    }
    
    try {
      const db = getDb();
      const drive = await getDriveClient();
      
      // Delete from Google Drive
      await drive.files.delete({ fileId: fileId });
      
      // Delete from Firestore
      await db.collection('files').doc(fileId).delete();
      
      return { success: true };
      
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error(`internal: ${error.message}`);
    }
  }
);