// src/services/mockTestService.js - D1 for list, Sheet for questions
import { getMockTestsFromD1 } from './d1Service';

// Google Sheet API for questions (keep existing)
const MOCK_TEST_API_URL = 'https://script.google.com/macros/s/AKfycby8lS5Mmxh8oDkXvgMSBp1iLyMAG1RUI0l_t_JfMxD6yAyMmHZ5do01KeRXAHcLl4s/exec';

// Cache for questions (to reduce API calls)
let questionCache = new Map();
let cachedPapers = null;
let lastFetchTime = null;
let pendingRequest = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const QUESTION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function isCacheValid() {
  if (!cachedPapers || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

export function invalidateMockTestCache() {
  console.log('🔄 Mock test cache invalidated');
  cachedPapers = null;
  lastFetchTime = null;
  pendingRequest = null;
  questionCache.clear();
}

export async function getAllPapers(forceRefresh = false) {
  if (forceRefresh) invalidateMockTestCache();
  
  if (isCacheValid() && cachedPapers) {
    console.log('📦 Using cached papers from D1');
    return cachedPapers;
  }
  
  if (pendingRequest) {
    return pendingRequest;
  }
  
  pendingRequest = (async () => {
    try {
      console.log('📡 Fetching mock tests from D1 via direct fetch...');
      const response = await fetch('https://onlibry-main-api.mdhabibul12212141.workers.dev/api/mock-tests');
      const result = await response.json();
      
      if (result.success && result.tests) {
        const papers = result.tests.map(test => ({
          id: test.id,
          originalName: test.name,
          displayName: test.display_name || test.name,
          category: test.category || 'General',
          subCategory: test.sub_category || '',
          duration: test.duration || 90,
          positiveMark: test.positive_mark || 1,
          negativeMark: test.negative_mark || 0,
          isFree: test.is_free === 1,
          price: test.price || 49,
          totalQuestions: test.total_questions || 0,
          sheetName: test.sheet_name || test.name,
          instructions: test.instructions || '',
          displayPrice: test.is_free === 1 ? 'Free' : `₹${test.price || 49}`,
          link: test.Link || null
        }));
        
        console.log('✅ Mock tests from D1:', papers.length);
        
        cachedPapers = papers;
        lastFetchTime = Date.now();
        return papers;
      }
      
      return [];
      
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      return cachedPapers || [];
    } finally {
      pendingRequest = null;
    }
  })();
  
  return pendingRequest;
}

// ============================================
// GET EXAM DATA (QUESTIONS FROM SHEET - SAME AS BEFORE)
// ============================================
export async function getExamData(examName, forceRefresh = false) {
  try {
    // Check question cache first
    if (!forceRefresh && questionCache.has(examName)) {
      console.log(`📦 Using cached questions for: ${examName}`);
      return questionCache.get(examName);
    }
    
    console.log(`📡 Fetching questions from sheet for: ${examName}`);
    const url = `${MOCK_TEST_API_URL}?action=getExamData&examName=${encodeURIComponent(examName)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load exam data');
    }
    
    const examData = {
      questions: data.questions || [],
      config: data.config || { Duration: 90, PositiveMark: 1, NegativeMark: 0 }
    };
    
    // Cache questions for 1 hour
    questionCache.set(examName, examData);
    setTimeout(() => questionCache.delete(examName), QUESTION_CACHE_DURATION);
    
    return examData;
  } catch (error) {
    console.error("Error fetching exam data:", error);
    return { questions: [], config: { Duration: 90, PositiveMark: 1, NegativeMark: 0 } };
  }
}

// ============================================
// GET ALL CATEGORIES (from D1 data)
// ============================================
export async function getAllCategories() {
  const papers = await getAllPapers();
  const categories = [...new Set(papers.map(p => p.category))];
  return categories.sort();
}

// ============================================
// GET SUB-CATEGORIES (from D1 data)
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
// LEGACY EXPORTS (for compatibility)
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
  // Also log to D1 if needed
  try {
    const { logMockResultToD1 } = await import('./d1Service');
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('../config/firebase');
    
    const user = getAuth().currentUser;
    if (user && resultData) {
      await logMockResultToD1(
        user.uid,
        resultData.testName || 'Unknown',
        resultData.totalQuestions || 0,
        resultData.correct || 0,
        resultData.incorrect || 0,
        resultData.unanswered || 0,
        resultData.score || 0,
        resultData.timeTaken || 0
      );
    }
  } catch (e) {
    console.error('Error logging to D1:', e);
  }
}