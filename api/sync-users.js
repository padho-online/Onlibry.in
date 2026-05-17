// api/sync-users.js
// Automatic Firebase Users Sync to D1
// Run this every hour using Vercel Cron Jobs or external scheduler

import { db as adminDb } from '../lib/firebase-admin.js';

const D1_API_URL = 'https://onlibry-main-api.mdhabibul12212141.workers.dev';
const ADMIN_KEY = process.env.VITE_NOTIFICATION_ADMIN_KEY || 'HabibulAdmin@2025';

// Helper function to call D1 API
async function callD1API(endpoint, options = {}) {
  const response = await fetch(`${D1_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_KEY,
      ...options.headers,
    },
  });
  return await response.json();
}

// Get user subscription from Firestore
async function getUserSubscription(uid) {
  try {
    const userDoc = await adminDb.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      const subscription = data.subscription || {};
      return {
        type: subscription.type || 'free',
        endDate: subscription.endDate || null,
        isActive: subscription.isActive || false
      };
    }
  } catch (error) {
    console.error(`Error fetching subscription for ${uid}:`, error);
  }
  return { type: 'free', endDate: null, isActive: false };
}

// Get user admin status from Firestore
async function getUserAdminStatus(uid) {
  try {
    const userDoc = await adminDb.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().isAdmin === true;
    }
  } catch (error) {
    console.error(`Error fetching admin status for ${uid}:`, error);
  }
  return false;
}

// Get user ban status from Firestore
async function getUserBanStatus(uid) {
  try {
    const userDoc = await adminDb.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().isBanned === true;
    }
  } catch (error) {
    console.error(`Error fetching ban status for ${uid}:`, error);
  }
  return false;
}

// Main sync handler
export default async function handler(req, res) {
  // Allow GET for testing and health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Sync users API is working. Use POST to sync users.',
      endpoints: {
        sync: 'POST /api/sync-users',
        health: 'GET /api/sync-users'
      }
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify admin key
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    console.log('🔄 Starting users sync from Firebase to D1...');
    
    // Fetch all users from Firebase Auth
    const listUsersResult = await adminDb.auth().listUsers(1000);
    const users = [];
    
    for (const user of listUsersResult.users) {
      // Get additional data from Firestore
      const [subscription, isAdmin, isBanned] = await Promise.all([
        getUserSubscription(user.uid),
        getUserAdminStatus(user.uid),
        getUserBanStatus(user.uid)
      ]);
      
      users.push({
        id: user.uid,
        email: user.email || '',
        display_name: user.displayName || user.email?.split('@')[0] || '',
        photo_url: user.photoURL || '',
        created_at: user.metadata.creationTime,
        is_admin: isAdmin,
        is_banned: isBanned,
        subscription_type: subscription.isActive ? subscription.type : 'free',
        subscription_end: subscription.isActive ? subscription.endDate : null
      });
    }
    
    console.log(`📊 Found ${users.length} users to sync`);
    
    // Sync to D1 in batches (50 users per batch to avoid timeout)
    const BATCH_SIZE = 50;
    let synced = 0;
    let updated = 0;
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const result = await callD1API('/api/sync/users', {
        method: 'POST',
        body: JSON.stringify({ users: batch })
      });
      
      if (result.success) {
        synced += result.synced || 0;
        updated += result.updated || 0;
      }
      
      console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: synced ${result.synced || 0}, updated ${result.updated || 0}`);
    }
    
    console.log(`✅ Users sync complete: ${synced} new, ${updated} updated, ${users.length} total`);
    
    return res.status(200).json({
      success: true,
      synced: synced,
      updated: updated,
      total: users.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Sync users error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}