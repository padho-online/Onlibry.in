// src/services/cloudflareFileService.js
// UPDATED for single file storage (no /books/ folder)

const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;
const WORKER_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;

// Cache System
let cachedFiles = null;
let lastFetchTime = null;
let pendingRequest = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
  if (!cachedFiles || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

export function invalidateFileCache() {
  console.log('🔄 Cache invalidated');
  cachedFiles = null;
  lastFetchTime = null;
  pendingRequest = null;
}

export async function getAllFilesFromSheet(forceRefresh = false) {
  if (forceRefresh) invalidateFileCache();
  
  if (isCacheValid() && cachedFiles) {
    console.log('📦 Using cached files');
    return cachedFiles;
  }
  
  if (pendingRequest) {
    return pendingRequest;
  }
  
  pendingRequest = (async () => {
    try {
      console.log('📡 Fetching files from Google Sheet...');
      const response = await fetch(SHEET_API_URL);
      const data = await response.json();
      
      console.log('✅ Files loaded:', data.files?.length || 0);
      
      if (data.success && data.files) {
        const filesWithUrl = data.files.map(file => {
          let tagsArray = [];
          let finalTags = {};
          
          if (file.tagsString && file.tagsString.trim()) {
            tagsArray = file.tagsString.split(',').map(t => t.trim()).filter(t => t);
            finalTags = { tags: tagsArray };
          }
          else if (file.tags && typeof file.tags === 'object' && Object.keys(file.tags).length > 0) {
            Object.values(file.tags).forEach(values => {
              if (Array.isArray(values)) tagsArray.push(...values);
              else if (typeof values === 'string') tagsArray.push(values);
            });
            finalTags = file.tags;
          }
          
          // 🔥 SINGLE FILE STORAGE: Direct file URL
          const fileId = file.cloudflareKey || file.id;
          
          return {
            ...file,
            id: fileId,
            originalId: file.id,
            tags: finalTags,
            tagsList: tagsArray,
            tagsString: file.tagsString || '',
            downloadUrl: `${WORKER_URL}/download/${encodeURIComponent(fileId)}`,
            viewerUrl: `${WORKER_URL}/view/${encodeURIComponent(fileId)}`,
            fileUrl: `${WORKER_URL}/${encodeURIComponent(fileId)}`
          };
        });
        
        cachedFiles = filesWithUrl;
        lastFetchTime = Date.now();
        return filesWithUrl;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error loading files:', error);
      return cachedFiles || [];
    } finally {
      pendingRequest = null;
    }
  })();
  
  return pendingRequest;
}

export async function getFileByIdFromSheet(fileId) {
  try {
    const allFiles = await getAllFilesFromSheet();
    return allFiles.find(f => f.id === fileId || f.cloudflareKey === fileId || f.originalId === fileId) || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function searchFilesInSheet(searchQuery) {
  const allFiles = await getAllFilesFromSheet();
  const lowerQuery = searchQuery.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) return [];
  
  return allFiles.filter(file => {
    if (file.showOnWebsite !== true) return false;
    
    const searchText = [
      file.name || '',
      file.tagsString || '',
      ...(file.tagsList || [])
    ].join(' ').toLowerCase();
    
    return words.some(word => searchText.includes(word));
  });
}

export function getDownloadUrl(file) {
  const key = file.cloudflareKey || file.id;
  return `${WORKER_URL}/download/${encodeURIComponent(key)}`;
}

export function getViewerUrl(file) {
  const key = file.cloudflareKey || file.id;
  return `${WORKER_URL}/view/${encodeURIComponent(key)}`;
}

async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
}

export async function addFileToSheet(fileData, user) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'add',
        fileId: fileData.fileId,
        fileName: fileData.fileName,
        fileSize: fileData.size,
        mimeType: fileData.mimeType,
        price: fileData.price || 29,
        isPremium: fileData.isPremium !== false,
        showOnWebsite: fileData.showOnWebsite !== false,
        tags: fileData.tags || '',
        cloudflareKey: fileData.fileId,
        uploadedBy: user?.email || 'unknown',
        uploadedByUid: user?.uid || 'unknown',
        uploadedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userIp: await getClientIP()
      })
    });
    invalidateFileCache();
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function updateFileInSheet(fileId, updates, user) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'update',
        fileId: fileId,
        fileName: updates.name,
        price: updates.price,
        isPremium: updates.isPremium,
        showOnWebsite: updates.showOnWebsite,
        tags: updates.tags,
        updatedBy: user?.email || 'unknown',
        updatedByUid: user?.uid || 'unknown',
        updatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userIp: await getClientIP()
      })
    });
    invalidateFileCache();
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function deleteFileFromSheet(fileId, fileName, user) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'delete',
        fileId: fileId,
        fileName: fileName,
        deletedBy: user?.email || 'unknown',
        deletedByUid: user?.uid || 'unknown',
        deletedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userIp: await getClientIP(),
        reason: 'Manual delete'
      })
    });
    invalidateFileCache();
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function logActionToSheet(action, details, user) {
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'adminAction',
        adminAction: action,
        details: JSON.stringify(details),
        performedBy: user?.email || 'unknown',
        performedByUid: user?.uid || 'unknown',
        performedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userIp: await getClientIP()
      })
    });
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}