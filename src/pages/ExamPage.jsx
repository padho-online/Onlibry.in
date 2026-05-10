// src/pages/ExamPage.jsx
// UPDATED - With proper purchased item access check

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getExamData, logExamResult, getAllPapers } from '../services/mockTestService';
import { logMockTestResult } from '../services/loggerService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

function ExamPage() {
  const { examName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  
  const [examData, setExamData] = useState({ questions: [], config: {} });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examStartTime, setExamStartTime] = useState(null);
  const [paperInfo, setPaperInfo] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const getDecodedExamName = () => {
    let decoded = examName ? decodeURIComponent(examName) : null;
    if (!decoded) {
      const sheetParam = searchParams.get('sheet');
      if (sheetParam) {
        decoded = decodeURIComponent(sheetParam);
      }
    }
    return decoded;
  };

  // 🔥 NEW: Check if user has purchased this specific mock test
  const checkPurchasedMockTest = async (userId, testId) => {
    if (!userId) return false;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const purchasedMockTests = userDoc.data()?.purchasedMockTests || [];
      
      // Check if 'all' (subscription) or specific test id
      if (purchasedMockTests === 'all') return true;
      if (Array.isArray(purchasedMockTests) && purchasedMockTests.includes(testId)) return true;
      return false;
    } catch (error) {
      console.error('Error checking purchased mock test:', error);
      return false;
    }
  };

  // Check if user can access this exam
  const checkAccess = async (decodedName) => {
    setCheckingAccess(true);
    try {
      const papers = await getAllPapers();
      const paper = papers.find(p => p.originalName === decodedName);
      setPaperInfo(paper);
      
      if (!paper) {
        setError('Exam not found');
        setCheckingAccess(false);
        return false;
      }
      
      // 🔥 CASE 1: Free test - always accessible
      if (paper.isFree) {
        setCheckingAccess(false);
        return true;
      }
      
      // 🔥 CASE 2: Premium user - all tests accessible
      if (isSubscribed) {
        setCheckingAccess(false);
        return true;
      }
      
      // 🔥 CASE 3: User not logged in
      if (!user) {
        setAccessDenied(true);
        setCheckingAccess(false);
        return false;
      }
      
      // 🔥 CASE 4: Check if user purchased this specific test
      const purchased = await checkPurchasedMockTest(user.uid, paper.id);
      setIsPurchased(purchased);
      
      if (purchased) {
        setCheckingAccess(false);
        return true;
      }
      
      // 🔥 CASE 5: Not subscribed and not purchased - deny access
      setAccessDenied(true);
      setCheckingAccess(false);
      return false;
      
    } catch (error) {
      console.error('Error checking access:', error);
      setCheckingAccess(false);
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const decodedName = getDecodedExamName();
      if (!decodedName) {
        setError('No exam specified');
        setLoading(false);
        setCheckingAccess(false);
        return;
      }
      
      const hasAccess = await checkAccess(decodedName);
      if (hasAccess) {
        await loadExam();
      } else {
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      if (examStartTime) {
        saveProgressToLocal();
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const loadExam = async () => {
    setLoading(true);
    setError(null);
    
    const decodedName = getDecodedExamName();
    
    if (!decodedName) {
      setError('No exam specified');
      setLoading(false);
      return;
    }
    
    console.log('📚 Loading exam:', decodedName);
    
    try {
      const data = await getExamData(decodedName);
      
      if (!data.questions || data.questions.length === 0) {
        setError('No questions found for this exam.');
        setLoading(false);
        return;
      }
      
      setExamData(data);
      const duration = data.config?.Duration || 90;
      setTimeLeft(duration * 60);
      setExamStartTime(Date.now());
      
      const saved = localStorage.getItem(`exam_progress_${decodedName}`);
      if (saved) {
        try {
          const progress = JSON.parse(saved);
          setAnswers(progress.answers || {});
          setMarkedQuestions(progress.markedQuestions || {});
          setCurrentQuestion(progress.currentQuestion || 0);
          const elapsed = Math.floor((Date.now() - progress.startTime) / 1000);
          setTimeLeft(Math.max(0, (duration * 60) - elapsed));
        } catch (e) {
          console.error('Error parsing saved progress:', e);
        }
      }
      
    } catch (err) {
      console.error('Error loading exam:', err);
      setError(err.message || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  const saveProgressToLocal = () => {
    const decodedName = getDecodedExamName();
    if (decodedName && examStartTime) {
      localStorage.setItem(`exam_progress_${decodedName}`, JSON.stringify({
        answers,
        markedQuestions,
        currentQuestion,
        startTime: examStartTime
      }));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/\^\^([^\^]+)\^\^/g, '<sub>$1</sub>')
      .replace(/\^([^\^]+)\^?/g, '<sup>$1</sup>')
      .replace(/\r?\n/g, '<br>');
  };

  const selectOption = (option) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: option }));
    saveProgressToLocal();
  };

  const markQuestion = () => {
    setMarkedQuestions(prev => ({
      ...prev,
      [currentQuestion]: !prev[currentQuestion]
    }));
    saveProgressToLocal();
  };

  const nextQuestion = () => {
    if (currentQuestion < examData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const gotoQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const calculateResults = () => {
    let correct = 0, incorrect = 0, unanswered = 0;
    examData.questions.forEach((q, i) => {
      const userAns = answers[i];
      if (!userAns) {
        unanswered++;
      } else if (userAns === q.correct) {
        correct++;
      } else {
        incorrect++;
      }
    });
    
    const timeTaken = Math.floor((Date.now() - examStartTime) / 60000);
    
    return { correct, incorrect, unanswered, totalQuestions: examData.questions.length, timeTaken };
  };

  const submitExam = async () => {
    const results = calculateResults();
    const decodedName = getDecodedExamName();
    
    if (!decodedName) return;
    
    const resultPayload = {
      testName: decodedName,
      totalQuestions: results.totalQuestions,
      correct: results.correct,
      incorrect: results.incorrect,
      unanswered: results.unanswered,
      score: results.correct,
      timeTaken: results.timeTaken
    };
    
    await logMockTestResult(resultPayload);
    
    const examResultPayload = {
      score: results.correct,
      answeredCount: results.correct + results.incorrect,
      unansweredCount: results.unanswered,
      totalQuestions: results.totalQuestions,
      timeTaken: results.timeTaken,
      answers: answers,
      year: decodedName,
      config: examData.config
    };
    
    localStorage.setItem(`exam_result_${decodedName}`, JSON.stringify(examResultPayload));
    localStorage.setItem('activeResultKey', `exam_result_${decodedName}`);
    
    await logExamResult(examResultPayload, 'mock');
    localStorage.removeItem(`exam_progress_${decodedName}`);
    
    navigate(`/mock-test-results?exam=${encodeURIComponent(decodedName)}`);
  };

  const autoSubmit = () => {
    alert('Time is up! Submitting your exam...');
    submitExam();
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData.questions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentQ = examData.questions[currentQuestion];
  const displayName = getDecodedExamName() || 'Exam';

  // 🔥 Access Denied State - Premium content (not purchased, not subscribed)
  if (accessDenied && paperInfo && !paperInfo.isFree && !checkingAccess) {
    // Check if user is logged in
    if (!user) {
      return (
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Login Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please login to access this mock test.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/login', { state: { from: `/mock-test/${encodeURIComponent(paperInfo.originalName)}` } })}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
            >
              Login Now
            </button>
            <button
              onClick={() => navigate('/mock-tests')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg"
            >
              Back to Tests
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Premium Content</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This mock test is only available for premium subscribers or individual purchase.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {paperInfo.displayName} - {paperInfo.displayPrice}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate('/pricing', { state: { from: `/mock-test/${encodeURIComponent(paperInfo.originalName)}` } })}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold"
          >
            Subscribe ₹{paperInfo.price || 49}
          </button>
          <button
            onClick={() => {
              // Add to cart and go to cart
              const { addToCart } = require('../contexts/CartContext').useCart();
              addToCart({
                id: paperInfo.id,
                name: paperInfo.displayName,
                price: paperInfo.price || 49,
                type: 'mocktest',
                originalName: paperInfo.originalName
              });
              navigate('/pricing', { state: { activeTab: 'cart' } });
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Buy Now (₹{paperInfo.price || 49})
          </button>
          <button
            onClick={() => navigate('/mock-tests')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading || checkingAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading exam...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error Loading Exam</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button onClick={() => navigate('/mock-tests')} className="px-6 py-2 bg-green-600 text-white rounded-lg">
          Back to Mock Tests
        </button>
      </div>
    );
  }

  // No Questions State
  if (!examData.questions || examData.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-yellow-500 text-6xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Questions Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">This exam doesn't have any questions yet.</p>
        <button onClick={() => navigate('/mock-tests')} className="px-6 py-2 bg-green-600 text-white rounded-lg">
          Back to Mock Tests
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md p-4 mb-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate max-w-md">
            {displayName}
          </h2>
          <div className="text-xl font-bold text-white bg-red-600 px-4 py-1 rounded-full">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Question Section */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 dark:text-white text-lg" 
                   dangerouslySetInnerHTML={{ __html: formatText(currentQ?.text) }} />
              </div>
              
              {currentQ?.image && (
                <img src={currentQ.image} alt="Question" className="max-w-full max-h-64 my-4 rounded-lg" />
              )}
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => selectOption(opt)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      answers[currentQuestion] === opt
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }`}
                  >
                    <strong>{opt})</strong>{' '}
                    <span dangerouslySetInnerHTML={{ __html: formatText(currentQ?.options?.[opt]) }} />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={markQuestion}
                  className={`px-4 py-2 rounded-lg transition ${
                    markedQuestions[currentQuestion]
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {markedQuestions[currentQuestion] ? 'Unmark' : 'Mark for Review'}
                </button>
                <button
                  onClick={nextQuestion}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {currentQuestion === totalQuestions - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Navigation Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sticky top-24">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                Question Navigation
              </h3>
              
              <div className="mb-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <span>Answered: {answeredCount}</span>
                <span>Marked: {Object.keys(markedQuestions).length}</span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {examData.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => gotoQuestion(idx)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition ${
                      currentQuestion === idx
                        ? 'bg-blue-600 text-white'
                        : answers[idx]
                        ? 'bg-green-500 text-white'
                        : markedQuestions[idx]
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Submit Exam?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have answered {answeredCount} out of {totalQuestions} questions.
              {totalQuestions - answeredCount > 0 && ` ${totalQuestions - answeredCount} questions remain unanswered.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg"
              >
                Continue
              </button>
              <button
                onClick={submitExam}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamPage;