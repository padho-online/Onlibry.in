import { db, auth } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { logSavedFileToSheet } from './firebaseLogger';

// ============================================
// 1. GET ALL FILES (with pagination - supports 500+ files)
// ============================================
export async function getAllFiles(pageParam = null, pageSize = 20) {
  try {
    let filesQuery = query(
      collection(db, 'files'),
      where('showOnWebsite', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (pageParam) {
      filesQuery = query(filesQuery, startAfter(pageParam));
    }

    const querySnapshot = await getDocs(filesQuery);
    const files = [];
    let lastVisible = null;

    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
      lastVisible = doc;
    });

    return {
      files,
      lastVisible,
      hasMore: files.length === pageSize
    };
  } catch (error) {
    console.error('Error getting files:', error);
    return { files: [], lastVisible: null, hasMore: false };
  }
}

// ============================================
// 2. LOAD ALL FILES (recursive - for admin panel)
// ============================================
export async function loadAllFilesForAdmin() {
  let allFiles = [];
  let lastDoc = null;
  let hasMore = true;
  const pageSize = 100;

  try {
    while (hasMore) {
      let filesQuery = query(
        collection(db, 'files'),
        where('showOnWebsite', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        filesQuery = query(filesQuery, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(filesQuery);
      
      querySnapshot.forEach((doc) => {
        allFiles.push({ id: doc.id, ...doc.data() });
      });
      
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      hasMore = querySnapshot.docs.length === pageSize;
    }
    
    return allFiles;
  } catch (error) {
    console.error('Error loading all files:', error);
    return allFiles;
  }
}

// ============================================
// 3. SEARCH FILES BY RELEVANCE
// ============================================
export async function searchFiles(searchQuery) {
  const lowerQuery = searchQuery.toLowerCase();
  const isExactSearch = lowerQuery.startsWith('exact:');

  const rawQuery = isExactSearch
    ? searchQuery.slice(6).trim()
    : searchQuery;

  const queryTokens = rawQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (queryTokens.length === 0) return [];

  try {
    const filesQuery = query(
      collection(db, 'files'),
      where('showOnWebsite', '==', true)
    );

    const querySnapshot = await getDocs(filesQuery);
    const files = [];

    querySnapshot.forEach((doc) => {
      const fileData = doc.data();

      const searchableText = [
        fileData.name || '',
        ...(fileData.tags?.subject || []),
        ...(fileData.tags?.title || []),
        ...(fileData.tags?.other || []),
        ...(fileData.tags?.course || []),
        ...(fileData.tags?.university || []),
        ...(fileData.tags?.semester || [])
      ]
        .join(' ')
        .toLowerCase();

      if (isExactSearch) {
        const allTokensPresent = queryTokens.every((token) =>
          searchableText.includes(token)
        );

        if (allTokensPresent) {
          files.push({
            id: doc.id,
            ...fileData,
            _relevanceScore: queryTokens.length
          });
        }
      } else {
        let matchCount = 0;

        queryTokens.forEach((token) => {
          if (searchableText.includes(token)) {
            matchCount += 1;
          }
        });

        if (matchCount > 0) {
          files.push({
            id: doc.id,
            ...fileData,
            _relevanceScore: matchCount
          });
        }
      }
    });

    files.sort((a, b) => b._relevanceScore - a._relevanceScore);

    return files;
  } catch (error) {
    console.error('Error searching files:', error);
    return [];
  }
}

// ============================================
// 4. GET SINGLE FILE BY ID
// ============================================
export async function getFileById(fileId) {
  try {
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
}

// ============================================
// 5. SAVE FILE TO USER'S COLLECTION
// ============================================
export async function saveFile(fileId) {
  const user = auth.currentUser;

  console.log('📌 saveFile called - User:', user?.email || 'Not logged in');

  if (!user) {
    console.log('❌ User not logged in, cannot save');
    throw new Error('Please login to save files');
  }

  try {
    const userRef = doc(db, 'users', user.uid);

    await updateDoc(userRef, {
      savedFiles: arrayUnion(fileId)
    });

    // Get file name for logging
    const fileDoc = await getDoc(doc(db, 'files', fileId));
    const fileName = fileDoc.data()?.name || 'Unknown';
    
    console.log('📌 FILE SAVED in Firebase:', fileName);
    
    // Send to Google Sheet
    try {
      await logSavedFileToSheet(
        fileId,
        fileName,
        'save',
        user.uid,
        user.email,
        user.displayName || user.email?.split('@')[0]
      );
      console.log('✅ Sheet logging completed for SAVE');
    } catch (sheetError) {
      console.error('❌ Sheet logging failed but file was saved:', sheetError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// 6. UNSAVE FILE FROM USER'S COLLECTION
// ============================================
export async function unsaveFile(fileId) {
  const user = auth.currentUser;

  console.log('📌 unsaveFile called - User:', user?.email || 'Not logged in');

  if (!user) {
    console.log('❌ User not logged in, cannot unsave');
    throw new Error('Please login to unsave files');
  }

  try {
    const userRef = doc(db, 'users', user.uid);

    await updateDoc(userRef, {
      savedFiles: arrayRemove(fileId)
    });

    // Get file name for logging
    const fileDoc = await getDoc(doc(db, 'files', fileId));
    const fileName = fileDoc.data()?.name || 'Unknown';
    
    console.log('📌 FILE UNSAVED from Firebase:', fileName);
    
    // Send to Google Sheet
    try {
      await logSavedFileToSheet(
        fileId,
        fileName,
        'unsave',
        user.uid,
        user.email,
        user.displayName || user.email?.split('@')[0]
      );
      console.log('✅ Sheet logging completed for UNSAVE');
    } catch (sheetError) {
      console.error('❌ Sheet logging failed but file was unsaved:', sheetError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error unsaving file:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// 7. CHECK IF FILE IS SAVED BY USER
// ============================================
export async function isFileSaved(fileId) {
  const user = auth.currentUser;

  if (!user) return false;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const savedFiles = userDoc.data().savedFiles || [];
      return savedFiles.includes(fileId);
    }

    return false;
  } catch (error) {
    console.error('Error checking saved file:', error);
    return false;
  }
}

// ============================================
// 8. CHECK FILE ACCESS (FREE / PREMIUM / SUBSCRIBED)
// ============================================
export async function canAccessFile(fileId) {
  const user = auth.currentUser;

  // Guest user: only free files
  if (!user) {
    try {
      const fileDoc = await getDoc(doc(db, 'files', fileId));
      return !fileDoc.data()?.isPremium;
    } catch (error) {
      return false;
    }
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};

    // Check subscription
    const isSubscribed = userData.subscription?.isActive === true;
    if (isSubscribed) return true;

    // Check single purchase
    const purchasedFiles = userData.purchasedFiles || [];
    if (purchasedFiles.includes(fileId)) return true;

    // Check free file
    const fileDoc = await getDoc(doc(db, 'files', fileId));
    return !fileDoc.data()?.isPremium;
    
  } catch (error) {
    console.error('Error checking file access:', error);
    return false;
  }
}

// ============================================
// 9. GET FILE PRICE (for premium files)
// ============================================
export async function getFilePrice(fileId) {
  try {
    const fileDoc = await getDoc(doc(db, 'files', fileId));
    if (!fileDoc.exists()) return 29;
    
    const fileData = fileDoc.data();
    if (!fileData.isPremium) return 0;
    
    return fileData.price || 29;
  } catch (error) {
    console.error('Error getting file price:', error);
    return 29;
  }
}

// ============================================
// 10. PURCHASE SINGLE FILE ✅ FIXED
// ============================================
export async function purchaseFile(fileId) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Please login to purchase');
  }
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      purchasedFiles: arrayUnion(fileId)
    });
    
    console.log(`✅ File ${fileId} purchased by ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error purchasing file:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 11. UPDATE FILE METADATA (Admin only)
// ============================================
export async function updateFileMetadata(fileId, updates) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  try {
    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.data()?.isAdmin) {
      throw new Error('Admin access required');
    }
    
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating file metadata:', error);
    return { success: false, error: error.message };
  }
}