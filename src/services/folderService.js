import { db } from '../config/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

// Get all folders from Firestore
export async function getAllFolders() {
  try {
    const foldersQuery = query(collection(db, 'folders'), orderBy('level1'));
    const querySnapshot = await getDocs(foldersQuery);
    
    const folders = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const folder = {
        id: doc.id,
        levels: [],
        link: data.link || ''
      };
      
      // Collect levels 1-10
      for (let i = 1; i <= 10; i++) {
        const level = data[`level${i}`];
        if (level && level.trim()) {
          folder.levels.push(level.trim());
        }
      }
      
      folders.push(folder);
    });
    
    return folders;
  } catch (error) {
    console.error("Error loading folders:", error);
    return [];
  }
}

// Build folder tree structure
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
        if (idx === folder.levels.length - 1) fileCount++;
        else folderCount++;
      }
      current = current[level].children;
    });
  });
  
  return { tree, folderCount, fileCount };
}

// Search folders by query
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

// Generate auto link for file search
export function generateFolderLink(path) {
  const searchTerm = encodeURIComponent(`subpage:${path.join(' ').toLowerCase()}`);
  return `/files?search=${searchTerm}`;
}