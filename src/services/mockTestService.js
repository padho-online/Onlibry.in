// Google Apps Script Web App URL for Mock Tests
const MOCK_TEST_API_URL = 'https://script.google.com/macros/s/AKfycby8lS5Mmxh8oDkXvgMSBp1iLyMAG1RUI0l_t_JfMxD6yAyMmHZ5do01KeRXAHcLl4s/exec';

// Fetch all available exams
export async function getAllExams() {
  try {
    const response = await fetch(`${MOCK_TEST_API_URL}?action=getAllExams`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load exams');
    }
    
    return data.exams || [];
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
}

// Fetch exam data (questions + config)
export async function getExamData(examName) {
  try {
    const response = await fetch(`${MOCK_TEST_API_URL}?action=getExamData&examName=${encodeURIComponent(examName)}`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to load exam data');
    }
    
    return {
      questions: data.questions || [],
      config: data.config || { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 }
    };
  } catch (error) {
    console.error("Error fetching exam data:", error);
    return { questions: [], config: { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 } };
  }
}

// Fetch exam config only
export async function getExamConfig(examName) {
  try {
    const response = await fetch(`${MOCK_TEST_API_URL}?action=getExamConfig&examName=${encodeURIComponent(examName)}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return data.config;
    }
    return { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 };
  } catch (error) {
    console.error("Error fetching exam config:", error);
    return { Duration: 150, PositiveMark: 1, NegativeMark: 0.25 };
  }
}

// Log exam result to Google Sheets
export async function logExamResult(resultData, testType = 'mock') {
  const LOGGER_API_URL = 'https://script.google.com/macros/s/AKfycbwdOXnS04cwpomDvfxryZXbLU4j7vANHasFxg51CTgV2fJEDlI9qyuHuV_BlkYrYW-9/exec';
  
  try {
    await fetch(LOGGER_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        testType,
        ...resultData,
        timestamp: new Date().toISOString()
      })
    });
    console.log('Result logged successfully');
  } catch (error) {
    console.error('Error logging result:', error);
  }
}

// Process exam papers for display
export function processExamPapers(exams) {
  return exams.map(exam => {
    const examName = exam.ExamName || exam.examName || exam.name || '';
    const duration = exam.Duration || exam.duration || '150';
    const positiveMark = exam.PositiveMark || exam.positiveMark || '1';
    const negativeMark = exam.NegativeMark || exam.negativeMark || '0';
    
    if (!examName) return null;
    
    // Extract base key (before "-")
    const baseKey = examName.toLowerCase().split('-')[0];
    
    // Extract sub key (inside parentheses)
    const subMatch = examName.match(/\((.*?)\)/);
    const subKey = subMatch ? subMatch[1].toLowerCase() : null;
    
    return {
      id: examName.toLowerCase().replace(/\s+/g, '-'),
      originalName: examName,
      displayName: examName,
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

// Get unique exam categories for filters
export function getExamCategories(exams) {
  const categories = new Set();
  exams.forEach(exam => {
    if (exam.baseKey) categories.add(exam.baseKey);
  });
  return Array.from(categories);
}

// Get unique sub-categories for a specific exam
export function getSubCategories(exams, examKey) {
  const subCategories = new Set();
  exams.forEach(exam => {
    if (exam.baseKey === examKey && exam.subKey) {
      subCategories.add(exam.subKey);
    }
  });
  return Array.from(subCategories);
}