// src/services/quizService.js - D1 for list, Sheet for questions
import { getQuizzesFromD1 } from './d1Service';

// Google Sheet API for questions (keep existing)
const QUIZ_API_URL = 'https://script.google.com/macros/s/AKfycbw_EQodhlBjNO4sEdCftz-n7WYtIvLbbJsKxVMEkp-g7EtyqJszETsSiKjSQisel8DC4A/exec';

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

export function invalidateQuizCache() {
  console.log('🔄 Quiz cache invalidated');
  cachedPapers = null;
  lastFetchTime = null;
  pendingRequest = null;
  questionCache.clear();
}

export async function getAllPapers(forceRefresh = false) {
  if (forceRefresh) invalidateQuizCache();
  
  if (isCacheValid() && cachedPapers) {
    console.log('📦 Using cached quiz papers from D1');
    return cachedPapers;
  }
  
  if (pendingRequest) {
    return pendingRequest;
  }
  
  pendingRequest = (async () => {
    try {
      console.log('📡 Fetching quizzes from D1 via direct fetch...');
      const response = await fetch('https://onlibry-main-api.mdhabibul12212141.workers.dev/api/quizzes');
      const result = await response.json();
      
      if (result.success && result.quizzes) {
        const papers = result.quizzes.map(quiz => ({
          id: quiz.id,
          originalName: quiz.name,
          displayName: quiz.display_name || quiz.name,
          category: quiz.category || 'General',
          subCategory: quiz.sub_category || '',
          duration: quiz.duration || 30,
          positiveMark: quiz.positive_mark || 1,
          negativeMark: quiz.negative_mark || 0,
          isFree: quiz.is_free === 1,
          price: quiz.price || 29,
          totalQuestions: quiz.total_questions || 0,
          sheetName: quiz.sheet_name || quiz.name,
          instructions: quiz.instructions || '',
          displayPrice: quiz.is_free === 1 ? 'Free' : `₹${quiz.price || 29}`,
          link: quiz.Link || null
        }));
        
        console.log('✅ Quizzes from D1:', papers.length);
        
        cachedPapers = papers;
        lastFetchTime = Date.now();
        return papers;
      }
      
      return [];
      
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
// GET QUIZ DATA (QUESTIONS FROM SHEET - SAME AS BEFORE)
// ============================================
export async function getQuizData(quizName, forceRefresh = false) {
  try {
    // Check question cache first
    if (!forceRefresh && questionCache.has(quizName)) {
      console.log(`📦 Using cached questions for quiz: ${quizName}`);
      return questionCache.get(quizName);
    }
    
    console.log(`📡 Fetching questions from sheet for quiz: ${quizName}`);
    const url = `${QUIZ_API_URL}?action=getExamData&examName=${encodeURIComponent(quizName)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load quiz data');
    }
    
    const quizData = {
      questions: data.questions || [],
      config: data.config || { Duration: 30, PositiveMark: 1, NegativeMark: 0 }
    };
    
    // Cache questions for 1 hour
    questionCache.set(quizName, quizData);
    setTimeout(() => questionCache.delete(quizName), QUESTION_CACHE_DURATION);
    
    return quizData;
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return { questions: [], config: { Duration: 30, PositiveMark: 1, NegativeMark: 0 } };
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
// CHECK ACCESS (from D1 data)
// ============================================
export async function canAccessQuiz(quizName, userIsSubscribed = false) {
  const papers = await getAllPapers();
  const quiz = papers.find(p => p.originalName === quizName);
  if (!quiz) return false;
  if (quiz.isFree) return true;
  return userIsSubscribed;
}

// ============================================
// LEGACY EXPORTS (for compatibility)
// ============================================
export async function getAllQuizzes(forceRefresh = false) {
  return await getAllPapers(forceRefresh);
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
  // Also log to D1 if needed
  try {
    const { logQuizResultToD1 } = await import('./d1Service');
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('../config/firebase');
    
    const user = getAuth().currentUser;
    if (user && resultData) {
      await logQuizResultToD1(
        user.uid,
        resultData.quizName || 'Unknown',
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