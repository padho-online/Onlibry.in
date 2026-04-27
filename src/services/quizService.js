// Google Apps Script Web App URL for Quiz
const QUIZ_API_URL = 'https://script.google.com/macros/s/AKfycbw_EQodhlBjNO4sEdCftz-n7WYtIvLbbJsKxVMEkp-g7EtyqJszETsSiKjSQisel8DC4A/exec';

// Fetch all available quizzes
export async function getAllQuizzes() {
  try {
    const response = await fetch(`${QUIZ_API_URL}?action=getAllExams`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load quizzes');
    }
    
    return data.exams || [];
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
}

// Fetch quiz data (questions + config)
export async function getQuizData(quizName) {
  try {
    const response = await fetch(`${QUIZ_API_URL}?action=getExamData&examName=${encodeURIComponent(quizName)}`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load quiz data');
    }
    
    return {
      questions: data.questions || [],
      config: data.config || { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 }
    };
  } catch (error) {
    console.error("Error fetching quiz data:", error);
    return { questions: [], config: { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 } };
  }
}

// Fetch quiz config only
export async function getQuizConfig(quizName) {
  try {
    const response = await fetch(`${QUIZ_API_URL}?action=getExamConfig&examName=${encodeURIComponent(quizName)}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.config;
    }
    return { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 };
  } catch (error) {
    console.error("Error fetching quiz config:", error);
    return { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 };
  }
}

// Process quiz papers for display
export function processQuizPapers(quizzes) {
  return quizzes.map(quiz => {
    const quizName = quiz.ExamName || quiz.examName || quiz.name || '';
    const duration = quiz.Duration || quiz.duration || '150';
    const positiveMark = quiz.PositiveMark || quiz.positiveMark || '1';
    const negativeMark = quiz.NegativeMark || quiz.negativeMark || '0';
    
    if (!quizName) return null;
    
    // Extract base key (before "-")
    const baseKey = quizName.toLowerCase().split('-')[0];
    
    // Extract sub key (inside parentheses)
    const subMatch = quizName.match(/\((.*?)\)/);
    const subKey = subMatch ? subMatch[1].toLowerCase() : null;
    
    return {
      id: quizName.toLowerCase().replace(/\s+/g, '-'),
      originalName: quizName,
      displayName: quizName,
      baseKey,
      subKey,
      description: `Duration: ${duration} minutes | +${positiveMark} / -${negativeMark}`,
      duration: parseInt(duration),
      positiveMark: parseFloat(positiveMark),
      negativeMark: parseFloat(negativeMark),
      lastUpdated: new Date().toLocaleDateString()
    };
  }).filter(paper => paper !== null);
}

// Get unique quiz categories for filters
export function getQuizCategories(quizzes) {
  const categories = new Set();
  quizzes.forEach(quiz => {
    if (quiz.baseKey) categories.add(quiz.baseKey);
  });
  return Array.from(categories);
}

// Get unique sub-categories for a specific quiz
export function getQuizSubCategories(quizzes, quizKey) {
  const subCategories = new Set();
  quizzes.forEach(quiz => {
    if (quiz.baseKey === quizKey && quiz.subKey) {
      subCategories.add(quiz.subKey);
    }
  });
  return Array.from(subCategories);
}

// Log quiz result to Google Sheets
export async function logQuizResult(resultData) {
  const LOGGER_API_URL = 'https://script.google.com/macros/s/AKfycbwdOXnS04cwpomDvfxryZXbLU4j7vANHasFxg51CTgV2fJEDlI9qyuHuV_BlkYrYW-9/exec';
  
  try {
    await fetch(LOGGER_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quizResult',
        ...resultData,
        timestamp: new Date().toISOString()
      })
    });
    console.log('Quiz result logged successfully');
  } catch (error) {
    console.error('Error logging quiz result:', error);
  }
}