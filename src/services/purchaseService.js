// src/services/purchaseService.js
// Purchase tracking service - Handle all purchase related Firestore operations

import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Add purchased items to user's Firestore document
 * @param {string} userId - User UID
 * @param {Array} items - Array of purchased items { id, type }
 * @returns {Promise<Object>} - Success status
 */
export async function addPurchasedItems(userId, items) {
  if (!userId || !items || items.length === 0) {
    return { success: false, error: 'Invalid userId or items' };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentData = userDoc.data() || {};

    // Initialize arrays if not exists
    const purchasedFiles = [...(currentData.purchasedFiles || [])];
    const purchasedMockTests = [...(currentData.purchasedMockTests || [])];
    const purchasedQuizzes = [...(currentData.purchasedQuizzes || [])];

    // Separate items by type
    for (const item of items) {
      if (item.type === 'file' && !purchasedFiles.includes(item.id)) {
        purchasedFiles.push(item.id);
      } else if (item.type === 'mocktest' && !purchasedMockTests.includes(item.id)) {
        purchasedMockTests.push(item.id);
      } else if (item.type === 'quiz' && !purchasedQuizzes.includes(item.id)) {
        purchasedQuizzes.push(item.id);
      }
    }

    // Update Firestore
    await updateDoc(userRef, {
      purchasedFiles: purchasedFiles,
      purchasedMockTests: purchasedMockTests,
      purchasedQuizzes: purchasedQuizzes,
      lastPurchaseAt: serverTimestamp()
    });

    console.log('✅ Purchased items added:', { purchasedFiles, purchasedMockTests, purchasedQuizzes });
    return { success: true };

  } catch (error) {
    console.error('Error adding purchased items:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add single purchased item
 * @param {string} userId - User UID
 * @param {Object} item - Purchased item { id, type, name }
 * @returns {Promise<Object>} - Success status
 */
export async function addPurchasedItem(userId, item) {
  return addPurchasedItems(userId, [item]);
}

/**
 * Check if user has purchased a specific item
 * @param {string} userId - User UID
 * @param {string} itemId - Item ID
 * @param {string} type - 'file', 'mocktest', or 'quiz'
 * @returns {Promise<boolean>} - True if purchased
 */
export async function hasPurchasedItem(userId, itemId, type) {
  if (!userId || !itemId) return false;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};

    // Check subscription first (subscription gives access to all)
    const isSubscribed = userData.subscription?.isActive === true;
    if (isSubscribed && (type === 'mocktest' || type === 'quiz')) {
      return true;
    }

    // Check specific purchases
    if (type === 'file') {
      const purchasedFiles = userData.purchasedFiles || [];
      return purchasedFiles.includes(itemId);
    } else if (type === 'mocktest') {
      const purchasedMockTests = userData.purchasedMockTests || [];
      return purchasedMockTests === 'all' || purchasedMockTests.includes(itemId);
    } else if (type === 'quiz') {
      const purchasedQuizzes = userData.purchasedQuizzes || [];
      return purchasedQuizzes === 'all' || purchasedQuizzes.includes(itemId);
    }

    return false;
  } catch (error) {
    console.error('Error checking purchased item:', error);
    return false;
  }
}

/**
 * Get all purchased items for a user
 * @param {string} userId - User UID
 * @returns {Promise<Object>} - Object with purchasedFiles, purchasedMockTests, purchasedQuizzes
 */
export async function getUserPurchasedItems(userId) {
  if (!userId) {
    return { purchasedFiles: [], purchasedMockTests: [], purchasedQuizzes: [] };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};

    return {
      purchasedFiles: userData.purchasedFiles || [],
      purchasedMockTests: userData.purchasedMockTests || [],
      purchasedQuizzes: userData.purchasedQuizzes || []
    };
  } catch (error) {
    console.error('Error getting purchased items:', error);
    return { purchasedFiles: [], purchasedMockTests: [], purchasedQuizzes: [] };
  }
}

/**
 * Grant subscription access (sets purchasedMockTests and purchasedQuizzes to 'all')
 * @param {string} userId - User UID
 * @param {string} planType - Subscription plan type
 * @param {number} durationDays - Duration in days
 * @returns {Promise<Object>} - Success status
 */
export async function grantSubscriptionAccess(userId, planType, durationDays) {
  if (!userId) {
    return { success: false, error: 'Invalid userId' };
  }

  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      subscription: {
        type: planType,
        startDate: serverTimestamp(),
        endDate: endDate.toISOString(),
        isActive: true,
      },
      purchasedMockTests: 'all',
      purchasedQuizzes: 'all',
      lastSubscriptionAt: serverTimestamp()
    });

    console.log('✅ Subscription access granted for user:', userId);
    return { success: true };

  } catch (error) {
    console.error('Error granting subscription access:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has active subscription
 * @param {string} userId - User UID
 * @returns {Promise<boolean>} - True if subscription is active
 */
export async function hasActiveSubscription(userId) {
  if (!userId) return false;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};
    const subscription = userData.subscription || {};

    if (subscription.isActive && subscription.endDate) {
      const endDate = subscription.endDate.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
      if (endDate > new Date()) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Clear all purchased items (for testing/admin)
 * @param {string} userId - User UID
 * @returns {Promise<Object>} - Success status
 */
export async function clearPurchasedItems(userId) {
  if (!userId) {
    return { success: false, error: 'Invalid userId' };
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      purchasedFiles: [],
      purchasedMockTests: [],
      purchasedQuizzes: []
    });
    return { success: true };
  } catch (error) {
    console.error('Error clearing purchased items:', error);
    return { success: false, error: error.message };
  }
}