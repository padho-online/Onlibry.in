// src/services/quizService.js
// UPDATED - With premium access based on Instructions column

const QUIZ_API_URL = 'https://script.google.com/macros/s/AKfycbw_EQodhlBjNO4sEdCftz-n7WYtIvLbbJsKxVMEkp-g7EtyqJszETsSiKjSQisel8DC4A/exec';

// Cache
let cachedPapers = null;
let lastFetchTime = null;
let pendingRequest = null;
const CACHE_DURATION = 10 * 60 * 1000;

function isCacheValid() {
  if (!cachedPapers || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

export function invalidateQuizCache() {
  console.log('🔄 Quiz cache invalidated');
  cachedPapers = null;
  lastFetchTime = null;
  pendingRequest = null;
}

// ============================================
// MAIN FUNCTION - Get all quiz papers
// ============================================
export async function getAllPapers(forceRefresh = false) {
  if (forceRefresh) invalidateQuizCache();
  
  if (isCacheValid() && cachedPapers) {
    console.log('📦 Using cached quiz papers');
    return cachedPapers;
  }
  
  if (pendingRequest) {
    return pendingRequest;
  }
  
  pendingRequest = (async () => {
    try {
      console.log('📡 Fetching quizzes from Google Sheet...');
      const response = await fetch(`${QUIZ_API_URL}?action=getAllExams`);
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to load quizzes');
      }
      
      const rawExams = data.exams || [];
      console.log('✅ Raw quizzes count:', rawExams.length);
      
      // Process papers
      const papers = rawExams.map(exam => {
        const examName = exam.ExamName || exam.examName || exam.name || '';
        const duration = parseInt(exam.Duration || exam.duration || '30');
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
        
        // Parse like "QUIZ BATTLE|Saturday|13/9/2025|English"
        const parts = examName.split('|').map(p => p.trim());
        const category = parts[0];      // QUIZ BATTLE
        const subCategory = parts[1] || null;  // Saturday
        const extra = parts[2] || null;  // 13/9/2025
        const extra2 = parts[3] || null; // English
        
        // Simple display - just join all non-empty parts with " - "
        const allParts = [category, subCategory, extra, extra2].filter(p => p && p.trim());
        let displayName = allParts.join(' - ');
        if (!displayName) displayName = category;
        
        return {
          id: examName.toLowerCase().replace(/\|/g, '-').replace(/\s+/g, '-'),
          originalName: examName,
          displayName: displayName,
          category: category,
          subCategory: subCategory,
          extra: extra,
          extra2: extra2,
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
      
      console.log('✅ Processed quiz papers:', papers.length);
      console.log('✅ Free quizzes:', papers.filter(p => p.isFree).length);
      console.log('✅ Premium quizzes:', papers.filter(p => !p.isFree).length);
      console.log('✅ Quiz categories:', [...new Set(papers.map(p => p.category))]);
      
      cachedPapers = papers;
      lastFetchTime = Date.now();
      return papers;
      
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return cachedPapers || [];
    } finally {
      pendingRequest = null;
    }
  })();
  
  return pendingRequest;
}

// ============================================
// Get quiz data (questions)
// ============================================
export async function getQuizData(quizName, forceRefresh = false) {
  try {
    console.log(`📡 Fetching quiz data for: ${quizName}`);
    const url = `${QUIZ_API_URL}?action=getExamData&examName=${encodeURIComponent(quizName)}`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`📡 Response status:`, data.status);
    console.log(`📡 Questions count:`, data.questions?.length || 0);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load quiz data');
    }
    
    return {
      questions: data.questions || [],
      config: data.config || { Duration: 30, PositiveMark: 1, NegativeMark: 0 }
    };
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return { questions: [], config: { Duration: 30, PositiveMark: 1, NegativeMark: 0 } };
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
// Check if user can access quiz
// ============================================
export async function canAccessQuiz(quizName, userIsSubscribed = false) {
  const papers = await getAllPapers();
  const quiz = papers.find(p => p.originalName === quizName);
  
  if (!quiz) return false;
  if (quiz.isFree) return true;
  return userIsSubscribed;
}

// ============================================
// Legacy exports for compatibility
// ============================================
export async function getAllQuizzes(forceRefresh = false) {
  const papers = await getAllPapers(forceRefresh);
  return papers;
}

export async function processQuizPapersWithCache() {
  return await getAllPapers();
}

export async function getQuizCategories() {
  return await getAllCategories();
}

export async function getQuizSubCategories(categoryName) {
  return await getSubCategoriesForCategory(categoryName);
}

export async function refreshQuizzes() {
  invalidateQuizCache();
  return await getAllPapers(true);
}

export async function logQuizResult(resultData) {
  console.log('Quiz result logged:', resultData);
}