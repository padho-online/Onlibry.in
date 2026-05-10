// src/services/folderService.js
// UPDATED: Using environment variables for Google Sheet URL

// Google Sheet API URL - Using environment variable
const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;

// ============================================
// CACHE SYSTEM (5 minutes cache)
// ============================================
let cachedFolders = null;
let lastFetchTime = null;
let pendingRequest = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid() {
  if (!cachedFolders || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

export function invalidateFoldersCache() {
  console.log('🔄 Folders cache invalidated');
  cachedFolders = null;
  lastFetchTime = null;
  pendingRequest = null;
}

// ============================================
// Get all folders from Google Sheet
// ============================================
export async function getAllFolders(forceRefresh = false) {
  if (forceRefresh) {
    invalidateFoldersCache();
  }
  
  // Return cached data if valid
  if (isCacheValid() && cachedFolders) {
    console.log('📦 Using cached folders (last fetch:', new Date(lastFetchTime).toLocaleTimeString(), ')');
    return cachedFolders;
  }
  
  // Prevent multiple simultaneous requests
  if (pendingRequest) {
    console.log('⏳ Waiting for pending folders request...');
    return pendingRequest;
  }
  
  pendingRequest = (async () => {
    try {
      console.log('📡 Fetching folders from Google Sheet...');
      const response = await fetch(`${SHEET_API_URL}?action=getFolders`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load folders');
      }
      
      const foldersData = data.folders || [];
      const folders = [];
      
      for (let i = 0; i < foldersData.length; i++) {
        const row = foldersData[i];
        const folder = {
          id: `folder_${i}`,
          levels: [],
          link: row.link || ''
        };
        
        // Collect levels 1-10 (only non-empty values)
        const levelValues = [
          row.level1, row.level2, row.level3, row.level4, row.level5,
          row.level6, row.level7, row.level8, row.level9, row.level10
        ];
        
        for (let j = 0; j < levelValues.length; j++) {
          const level = levelValues[j];
          if (level && level.trim()) {
            folder.levels.push(level.trim());
          } else {
            // Stop at first empty level (don't add further empty levels)
            break;
          }
        }
        
        // Only add if at least one level exists
        if (folder.levels.length > 0) {
          folders.push(folder);
        }
      }
      
      console.log(`✅ Loaded ${folders.length} folders from sheet`);
      
      // Store in cache
      cachedFolders = folders;
      lastFetchTime = Date.now();
      
      return folders;
      
    } catch (error) {
      console.error("Error loading folders from sheet:", error);
      // Return cached data if available, even if expired
      if (cachedFolders) {
        console.log('⚠️ Using stale cache due to error');
        return cachedFolders;
      }
      return [];
    } finally {
      pendingRequest = null;
    }
  })();
  
  return pendingRequest;
}

// ============================================
// Build folder tree structure
// ============================================
export function buildFolderTree(folders) {
  const tree = {};
  let folderCount = 0;
  let fileCount = 0;
  
  folders.forEach(folder => {
    let current = tree;
    folder.levels.forEach((level, idx) => {
      if (!current[level]) {
        current[level] = {
          children: {},
          link: idx === folder.levels.length - 1 ? folder.link : '',
          isLeaf: idx === folder.levels.length - 1
        };
        if (idx === folder.levels.length - 1) {
          fileCount++;
        } else {
          folderCount++;
        }
      }
      current = current[level].children;
    });
  });
  
  return { tree, folderCount, fileCount };
}

// ============================================
// Search folders by query
// ============================================
export function searchFolders(folders, queryStr) {
  const lowerQuery = queryStr.toLowerCase();
  const isExact = lowerQuery.startsWith('exact:');
  const rawQuery = isExact ? queryStr.slice(6).trim() : queryStr;
  const terms = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  
  if (terms.length === 0) return folders;
  
  const matched = [];
  
  folders.forEach(folder => {
    const pathText = folder.levels.join(' ').toLowerCase();
    
    if (isExact) {
      const allMatch = terms.every(term => pathText.includes(term));
      if (allMatch) matched.push(folder);
    } else {
      let score = 0;
      terms.forEach(term => {
        if (pathText.includes(term)) score++;
      });
      if (score > 0) matched.push({ ...folder, score });
    }
  });
  
  if (!isExact) {
    matched.sort((a, b) => b.score - a.score);
  }
  
  return matched;
}

// ============================================
// Generate auto link for file search
// ============================================
export function generateFolderLink(path) {
  const searchTerm = encodeURIComponent(`subpage:${path.join(' ').toLowerCase()}`);
  return `/files?search=${searchTerm}`;
}

// ============================================
// Force refresh folders cache
// ============================================
export async function refreshFolders() {
  console.log('🔄 Force refreshing folders...');
  return await getAllFolders(true);
}