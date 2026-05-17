// api/sync-users.js - Using Firestore SDK (No Admin SDK required)
// This fetches users from Firestore and syncs to D1

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config (same as frontend)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const D1_API_URL = 'https://onlibry-main-api.mdhabibul12212141.workers.dev';
const ADMIN_KEY = process.env.VITE_NOTIFICATION_ADMIN_KEY || 'HabibulAdmin@2025';

// Initialize Firebase (for client-side SDK)
let firebaseApp = null;
let db = null;

function initFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
  }
  return { db };
}

export default async function handler(req, res) {
  // Allow GET for health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Sync users API is working. Use POST to sync users from Firestore.',
      timestamp: new Date().toISOString()
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
    console.log('🔄 Starting users sync from Firestore to D1...');
    
    // Initialize Firebase
    const { db } = initFirebase();
    
    // Fetch all users from Firestore
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Handle Firestore timestamps
      let createdAt = null;
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAt = data.createdAt;
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000).toISOString();
        }
      }
      
      // Handle subscription end date
      let subscriptionEnd = null;
      if (data.subscription?.endDate) {
        if (data.subscription.endDate.toDate) {
          subscriptionEnd = data.subscription.endDate.toDate().toISOString();
        } else if (typeof data.subscription.endDate === 'string') {
          subscriptionEnd = data.subscription.endDate;
        } else if (data.subscription.endDate.seconds) {
          subscriptionEnd = new Date(data.subscription.endDate.seconds * 1000).toISOString();
        }
      }
      
      users.push({
        id: doc.id,
        email: data.email || '',
        display_name: data.displayName || data.email?.split('@')[0] || '',
        photo_url: data.photoURL || '',
        created_at: createdAt || new Date().toISOString(),
        is_admin: data.isAdmin === true ? 1 : 0,
        is_banned: data.isBanned === true ? 1 : 0,
        subscription_type: data.subscription?.isActive ? (data.subscription?.type || 'monthly') : 'free',
        subscription_end: data.subscription?.isActive ? subscriptionEnd : null
      });
    });
    
    console.log(`📊 Found ${users.length} users in Firestore`);
    
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users found in Firestore',
        users: [],
        synced: 0,
        updated: 0
      });
    }
    
    // Sync to D1 in batches
    const BATCH_SIZE = 50;
    let totalSynced = 0;
    let totalUpdated = 0;
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      const response = await fetch(`${D1_API_URL}/api/sync/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': ADMIN_KEY
        },
        body: JSON.stringify({ users: batch })
      });
      
      const result = await response.json();
      
      if (result.success) {
        totalSynced += result.synced || 0;
        totalUpdated += result.updated || 0;
      }
      
      console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: synced ${result.synced || 0}, updated ${result.updated || 0}`);
    }
    
    console.log(`✅ Users sync complete: ${totalSynced} new, ${totalUpdated} updated, ${users.length} total`);
    
    return res.status(200).json({
      success: true,
      synced: totalSynced,
      updated: totalUpdated,
      total: users.length,
      users: users,
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