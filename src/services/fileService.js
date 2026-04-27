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

// Get all files (with pagination)
export async function getAllFiles(pageParam = null, pageSize = 20) {
  try {
    let filesQuery = query(
      collection(db, 'files'),
      where('showOnWebsite', '==', true),
      orderBy('createdAt', 'desc')
    );

    if (pageParam) {
      filesQuery = query(
        filesQuery,
        startAfter(pageParam),
        limit(pageSize)
      );
    } else {
      filesQuery = query(
        filesQuery,
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(filesQuery);
    const files = [];
    let lastVisible = null;

    querySnapshot.forEach((doc) => {
      files.push({
        id: doc.id,
        ...doc.data()
      });
      lastVisible = doc;
    });

    return { files, lastVisible };
  } catch (error) {
    console.error('Error getting files:', error);
    return {
      files: [],
      lastVisible: null
    };
  }
}

// Search files by relevance
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

// Get file by ID
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

// Save file
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
    
    // ✅ Send to Google Sheet
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

// Unsave file
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
    
    // ✅ Send to Google Sheet
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

// Check if file is saved
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

// Check access
export async function canAccessFile(fileId) {
  const user = auth.currentUser;

  if (!user) return false;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const isSubscribed = userDoc.data()?.subscription?.isActive || false;
    if (isSubscribed) return true;

    const purchasedFiles = userDoc.data()?.purchasedFiles || [];
    if (purchasedFiles.includes(fileId)) {
      return true;
    }

    const fileDoc = await getDoc(doc(db, 'files', fileId));
    const isFree = fileDoc.data()?.isFree !== false;

    return isFree;
  } catch (error) {
    console.error('Error checking file access:', error);
    return false;
  }
}