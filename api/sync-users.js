// api/sync-users.js
import { db as adminDb } from '../lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.VITE_NOTIFICATION_ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Fetch all users from Firebase Auth
    const listUsersResult = await adminDb.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      id: user.uid,
      email: user.email || '',
      display_name: user.displayName || '',
      photo_url: user.photoURL || '',
      created_at: user.metadata.creationTime,
      is_admin: false,
      is_banned: false
    }));
    
    // Sync to D1
    const response = await fetch('https://onlibry-main-api.mdhabibul12212141.workers.dev/api/sync/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': process.env.VITE_NOTIFICATION_ADMIN_KEY
      },
      body: JSON.stringify({ users })
    });
    
    const result = await response.json();
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Sync users error:', error);
    return res.status(500).json({ error: error.message });
  }
}