// src/services/cloudFunctions.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../config/firebase';

const functions = getFunctions();
// functions.region = 'us-central1';

// ============================================
// 1. SECURE FILE DOWNLOAD
// ============================================
export async function downloadFile(fileId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please login to download files');
    }
    
    const downloadFileFn = httpsCallable(functions, 'downloadFile');
    const result = await downloadFileFn({ fileId });
    
    return result.data;
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
}

// ============================================
// 2. CHECK SUBSCRIPTION STATUS
// ============================================
export async function checkSubscriptionStatus() {
  try {
    const checkSubscriptionFn = httpsCallable(functions, 'checkSubscription');
    const result = await checkSubscriptionFn({});
    
    return result.data;
  } catch (error) {
    console.error('Check subscription error:', error);
    return { isSubscribed: false, subscriptionType: null, expiresAt: null };
  }
}

// ============================================
// 3. GET SUBSCRIPTION PLANS
// ============================================
export async function getPlansFromCloud() {
  try {
    const getPlansFn = httpsCallable(functions, 'getPlans');
    const result = await getPlansFn({});
    
    return result.data;
  } catch (error) {
    console.error('Get plans error:', error);
    return { success: false, plans: {} };
  }
}

// ============================================
// 4. GET ALL FILES (Paginated)
// ============================================
export async function getAllFilesFromCloud(pageSize = 50, lastDocId = null) {
  try {
    const getAllFilesFn = httpsCallable(functions, 'getAllFiles');
    const result = await getAllFilesFn({ pageSize, lastDocId });
    
    return result.data;
  } catch (error) {
    console.error('Get files error:', error);
    return { success: false, files: [], lastId: null, hasMore: false };
  }
}

// ============================================
// 5. UPDATE SUBSCRIPTION (Admin only)
// ============================================
export async function updateSubscriptionCloud(userId, planType, durationDays, isActive) {
  try {
    const updateSubscriptionFn = httpsCallable(functions, 'updateSubscription');
    const result = await updateSubscriptionFn({ userId, planType, durationDays, isActive });
    
    return result.data;
  } catch (error) {
    console.error('Update subscription error:', error);
    throw error;
  }
}

// ============================================
// 6. GET DOWNLOAD LOGS (Admin only)
// ============================================
export async function getDownloadLogsFromCloud(limit = 100, startAfter = null) {
  try {
    const getDownloadLogsFn = httpsCallable(functions, 'getDownloadLogs');
    const result = await getDownloadLogsFn({ limit, startAfter });
    
    return result.data;
  } catch (error) {
    console.error('Get download logs error:', error);
    return { success: false, logs: [] };
  }
}

// ============================================
// 7. CREATE/UPDATE PLAN (Admin only)
// ============================================
export async function createPlanInCloud(planKey, planData) {
  try {
    const createPlanFn = httpsCallable(functions, 'createPlan');
    const result = await createPlanFn({ planKey, planData });
    
    return result.data;
  } catch (error) {
    console.error('Create plan error:', error);
    throw error;
  }
}

// ============================================
// 8. DELETE FILE (Admin only)
// ============================================
export async function deleteFileFromCloud(fileId) {
  try {
    const deleteFileFn = httpsCallable(functions, 'deleteFile');
    const result = await deleteFileFn({ fileId });
    
    return result.data;
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}