// src/services/mockTestService.js
// UPDATED - With premium access based on Instructions column

const MOCK_TEST_API_URL = 'https://script.google.com/macros/s/AKfycby8lS5Mmxh8oDkXvgMSBp1iLyMAG1RUI0l_t_JfMxD6yAyMmHZ5do01KeRXAHcLl4s/exec';

// Cache
let cachedPapers = null;
let lastFetchTime = null;
let pendingRequest = null;
const CACHE_DURATION = 10 * 60 * 1000;

function isCacheValid() {
  if (!cachedPapers || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

export function invalidateMockTestCache() {
  console.log('🔄 Mock test cache invalidated');
  cachedPapers = null;
  lastFetchTime = null;
  pendingRequest = null;
}

// ============================================
// MAIN FUNCTION - Get all papers
// ============================================
export async function getAllPapers(forceRefresh = false) {
  if (forceRefresh) invalidateMockTestCache();
  
  if (isCacheValid() && cachedPapers) {
    console.log('📦 Using cached papers');
    return cachedPapers;
  }
  
  if (pendingRequest) {
    return pendingRequest;
  }
  
  pendingRequest = (async () => {
    try {
      console.log('📡 Fetching exams from Google Sheet...');
      const response = await fetch(`${MOCK_TEST_API_URL}?action=getAllExams`);
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to load exams');
      }
      
      const rawExams = data.exams || [];
      console.log('✅ Raw exams count:', rawExams.length);
      
      // Process papers
      const papers = rawExams.map(exam => {
        const examName = exam.ExamName || exam.examName || exam.name || '';
        const duration = parseInt(exam.Duration || exam.duration || '90');
        const positiveMark = parseFloat(exam.PositiveMark || exam.positiveMark || '1');
        const negativeMark = parseFloat(exam.NegativeMark || exam.negativeMark || '0');
        const instructions = exam.Instructions || exam.instructions || '';
        
        if (!examName) return null;
        
        // 🔥 NEW: Parse price from Instructions column
        let price = null;
        let isFree = true;
        let displayPrice = 'Free';
        
        // Check for price pattern like "₹99" or "99" or "Rs. 99"
        const priceMatch = instructions.match(/₹?\s*(\d+)/);
        if (priceMatch && !instructions.toLowerCase().includes('free')) {
          price = parseInt(priceMatch[1]);
          isFree = false;
          displayPrice = `₹${price}`;
        }
        
        // Parse CPGET|Biotechnology or ICET|2024
        const parts = examName.split('|').map(p => p.trim());
        const category = parts[0];
        const subCategory = parts[1] || null;
        const extra = parts[2] || null;
        
        let displayName = '';
        if (subCategory) {
          displayName = `${category} - ${subCategory}`;
          if (extra) displayName += ` (${extra})`;
        } else {
          displayName = category;
        }
        
        return {
          id: examName.toLowerCase().replace(/\|/g, '-').replace(/\s+/g, '-'),
          originalName: examName,
          displayName: displayName,
          category: category,
          subCategory: subCategory,
          extra: extra,
          duration: duration,
          positiveMark: positiveMark,
          negativeMark: negativeMark,
          instructions: instructions,
          price: price,
          isFree: isFree,
          displayPrice: displayPrice,
          link: exam.Link || exam.link || null
        };
      }).filter(p => p !== null);
      
      console.log('✅ Processed papers:', papers.length);
      console.log('✅ Free papers:', papers.filter(p => p.isFree).length);
      console.log('✅ Premium papers:', papers.filter(p => !p.isFree).length);
      
      cachedPapers = papers;
      lastFetchTime = Date.now();
      return papers;
      
    } catch (error) {
      console.error("Error fetching exams:", error);
      return cachedPapers || [];
    } finally {
      pendingRequest = null;
    }
  })();
  
  return pendingRequest;
}

// ============================================
// Get exam data (questions)
// ============================================
export async function getExamData(examName, forceRefresh = false) {
  try {
    console.log(`📡 Fetching exam data for: ${examName}`);
    const url = `${MOCK_TEST_API_URL}?action=getExamData&examName=${encodeURIComponent(examName)}`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`📡 Response status:`, data.status);
    console.log(`📡 Questions count:`, data.questions?.length || 0);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load exam data');
    }
    
    return {
      questions: data.questions || [],
      config: data.config || { Duration: 90, PositiveMark: 1, NegativeMark: 0 }
    };
  } catch (error) {
    console.error("Error fetching exam data:", error);
    return { questions: [], config: { Duration: 90, PositiveMark: 1, NegativeMark: 0 } };
  }
}

// ============================================
// Get all categories
// ============================================
export async function getAllCategories() {
  const papers = await getAllPapers();
  const categories = [...new Set(papers.map(p => p.category))];
  return categories.sort();
}

// ============================================
// Get sub-categories for a category
// ============================================
export async function getSubCategoriesForCategory(categoryName) {
  const papers = await getAllPapers();
  const subCategories = [...new Set(
    papers.filter(p => p.category === categoryName && p.subCategory)
          .map(p => p.subCategory)
  )];
  return subCategories.sort();
}

// ============================================
// Legacy exports
// ============================================
export async function processExamPapersWithCache() {
  return await getAllPapers();
}

export async function getExamCategories() {
  return await getAllCategories();
}

export async function getSubCategories(categoryName) {
  return await getSubCategoriesForCategory(categoryName);
}

export async function refreshMockTests() {
  invalidateMockTestCache();
  return await getAllPapers(true);
}

export async function logExamResult(resultData, testType = 'mock') {
  console.log('Result logged:', resultData);
}