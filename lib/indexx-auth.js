import { auth, firestore } from './firebase-admin.js';

export async function verifyIndexXAdmin(req) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return { allowed: false, status: 401 };
  }

  try {
    const token = authorization.slice(7);
    const decoded = await auth.verifyIdToken(token, true);

    const allowedUIDs = (
      process.env.INDEXX_ADMIN_UIDS || ''
    ).split(',').map(v => v.trim()).filter(Boolean);

    if (!allowedUIDs.includes(decoded.uid)) {
      return { allowed: false, status: 403 };
    }

    const snapshot = await firestore
      .collection('users')
      .doc(decoded.uid)
      .get();

    if (
      !snapshot.exists ||
      snapshot.data()?.isAdmin !== true
    ) {
      return { allowed: false, status: 403 };
    }

    return {
      allowed: true,
      uid: decoded.uid
    };

  } catch (error) {
    console.error('IndexX authentication:', error.code);

    return { allowed: false, status: 401 };
  }
}
