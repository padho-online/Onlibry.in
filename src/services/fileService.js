// src/services/fileService.js
// UPDATED for single file storage

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
import { 
  getAllFilesFromSheet, 
  getFileByIdFromSheet, 
  searchFilesInSheet,
  getDownloadUrl,
  getViewerUrl,
  invalidateFileCache
} from './cloudflareFileService';

export async function getAllFiles(pageParam = null, pageSize = 20, forceRefresh = false) {
  try {
    let allFiles = await getAllFilesFromSheet(forceRefresh);
    allFiles = allFiles.filter(f => f.showOnWebsite === true);
    allFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const startIndex = pageParam || 0;
    const paginatedFiles = allFiles.slice(startIndex, startIndex + pageSize);
    
    const filesWithUrls = paginatedFiles.map(file => ({
      ...file,
      downloadUrl: getDownloadUrl(file),
      viewerUrl: getViewerUrl(file)
    }));
    
    return {
      files: filesWithUrls,
      lastVisible: startIndex + pageSize,
      hasMore: startIndex + pageSize < allFiles.length
    };
  } catch (error) {
    console.error('Error getting files:', error);
    return { files: [], lastVisible: null, hasMore: false };
  }
}

export async function loadAllFilesForAdmin(forceRefresh = false) {
  try {
    return await getAllFilesFromSheet(forceRefresh);
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function searchFiles(searchQuery) {
  try {
    const results = await searchFilesInSheet(searchQuery);
    return results.map(file => ({
      ...file,
      downloadUrl: getDownloadUrl(file),
      viewerUrl: getViewerUrl(file)
    }));
  } catch (error) {
    console.error('Error searching:', error);
    return [];
  }
}

export async function getFileById(fileId) {
  try {
    const file = await getFileByIdFromSheet(fileId);
    if (file) {
      return {
        ...file,
        downloadUrl: getDownloadUrl(file),
        viewerUrl: getViewerUrl(file)
      };
    }
    return null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function saveFile(fileId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please login to save files');
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { savedFiles: arrayUnion(fileId) });
    
    const file = await getFileByIdFromSheet(fileId);
    const fileName = file?.name || 'Unknown';
    
    await logSavedFileToSheet(fileId, fileName, 'save', user.uid, user.email, user.displayName || user.email?.split('@')[0]);
    return { success: true };
  } catch (error) {
    console.error('Error saving:', error);
    return { success: false, error: error.message };
  }
}

export async function unsaveFile(fileId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please login to unsave files');
  
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { savedFiles: arrayRemove(fileId) });
    
    const file = await getFileByIdFromSheet(fileId);
    const fileName = file?.name || 'Unknown';
    
    await logSavedFileToSheet(fileId, fileName, 'unsave', user.uid, user.email, user.displayName || user.email?.split('@')[0]);
    return { success: true };
  } catch (error) {
    console.error('Error unsaving:', error);
    return { success: false, error: error.message };
  }
}

export async function isFileSaved(fileId) {
  const user = auth.currentUser;
  if (!user) return false;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() ? (userDoc.data().savedFiles || []).includes(fileId) : false;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function canAccessFile(fileId) {
  const user = auth.currentUser;
  
  if (!user) {
    const file = await getFileByIdFromSheet(fileId);
    return !file?.isPremium;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data() || {};
    
    // Premium user has access to all files
    if (userData.subscription?.isActive === true) return true;
    // User purchased this specific file
    if ((userData.purchasedFiles || []).includes(fileId)) return true;
    
    const file = await getFileByIdFromSheet(fileId);
    return !file?.isPremium;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function getFilePrice(fileId) {
  try {
    const file = await getFileByIdFromSheet(fileId);
    if (!file) return 29;
    if (!file.isPremium) return 0;
    return file.price || 29;
  } catch (error) {
    return 29;
  }
}

export async function purchaseFile(fileId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please login to purchase');
  
  try {
    await updateDoc(doc(db, 'users', user.uid), { purchasedFiles: arrayUnion(fileId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateFileMetadata(fileId, updates) {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.data()?.isAdmin) throw new Error('Admin access required');
  
  invalidateFileCache();
  return { success: true };
}

export async function refreshFilesCache() {
  invalidateFileCache();
  return await getAllFilesFromSheet(true);
}