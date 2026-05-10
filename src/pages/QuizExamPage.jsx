// src/pages/QuizExamPage.jsx
// UPDATED - With premium access check before loading quiz

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getQuizData, logQuizResult, getAllPapers } from '../services/quizService';
import { logQuizResult as logQuizResultToLogger } from '../services/loggerService';
import { useAuth } from '../contexts/AuthContext';

function QuizExamPage() {
  const { quizName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  
  const [quizData, setQuizData] = useState({ questions: [], config: {} });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [paperInfo, setPaperInfo] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const getDecodedQuizName = () => {
    let decoded = quizName ? decodeURIComponent(quizName) : null;
    if (!decoded) {
      const sheetParam = searchParams.get('sheet');
      if (sheetParam) {
        decoded = decodeURIComponent(sheetParam);
      }
    }
    return decoded;
  };

  // Check if user can access this quiz
  const checkAccess = async (decodedName) => {
    const papers = await getAllPapers();
    const paper = papers.find(p => p.originalName === decodedName);
    setPaperInfo(paper);
    
    if (!paper) {
      setError('Quiz not found');
      return false;
    }
    
    if (paper.isFree) {
      return true;
    }
    
    // Premium quiz - check subscription
    if (!user) {
      setAccessDenied(true);
      return false;
    }
    
    if (!isSubscribed) {
      setAccessDenied(true);
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    const init = async () => {
      const decodedName = getDecodedQuizName();
      if (!decodedName) {
        setError('No quiz specified');
        setLoading(false);
        return;
      }
      
      const hasAccess = await checkAccess(decodedName);
      if (hasAccess) {
        await loadQuiz();
      } else {
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      if (quizStartTime) {
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

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    
    const decodedName = getDecodedQuizName();
    
    if (!decodedName) {
      setError('No quiz specified');
      setLoading(false);
      return;
    }
    
    console.log('📚 Loading quiz:', decodedName);
    
    try {
      const data = await getQuizData(decodedName);
      console.log('📚 Quiz data received:', data);
      
      if (!data.questions || data.questions.length === 0) {
        setError('No questions found for this quiz.');
        setLoading(false);
        return;
      }
      
      setQuizData(data);
      const duration = data.config?.Duration || 30;
      setTimeLeft(duration * 60);
      setQuizStartTime(Date.now());
      
      const saved = localStorage.getItem(`quiz_progress_${decodedName}`);
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
      console.error('Error loading quiz:', err);
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const saveProgressToLocal = () => {
    const decodedName = getDecodedQuizName();
    if (decodedName && quizStartTime) {
      localStorage.setItem(`quiz_progress_${decodedName}`, JSON.stringify({
        answers,
        markedQuestions,
        currentQuestion,
        startTime: quizStartTime
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
    if (currentQuestion < quizData.questions.length - 1) {
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
    quizData.questions.forEach((q, i) => {
      const userAns = answers[i];
      if (!userAns) {
        unanswered++;
      } else if (userAns === q.correct) {
        correct++;
      } else {
        incorrect++;
      }
    });
    
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    return { correct, incorrect, unanswered, totalQuestions: quizData.questions.length, timeTaken };
  };

  const submitQuiz = async () => {
    const results = calculateResults();
    const decodedName = getDecodedQuizName();
    if (!decodedName) return;
    
    console.log('📊 Submitting quiz:', decodedName);
    console.log('📊 Results:', results);
    
    const resultPayload = {
      quizName: decodedName,
      totalQuestions: results.totalQuestions,
      correct: results.correct,
      incorrect: results.incorrect,
      unanswered: results.unanswered,
      score: results.correct,
      timeTaken: Math.floor(results.timeTaken / 60),
      percentage: ((results.correct / results.totalQuestions) * 100).toFixed(2)
    };
    
    await logQuizResultToLogger(resultPayload);
    await logQuizResult(resultPayload);
    
    const quizResultPayload = {
      score: results.correct,
      answeredCount: results.correct + results.incorrect,
      unansweredCount: results.unanswered,
      totalQuestions: results.totalQuestions,
      timeTaken: results.timeTaken,
      answers: answers,
      config: quizData.config
    };
    
    localStorage.setItem(`quiz_result_${decodedName}`, JSON.stringify(quizResultPayload));
    localStorage.setItem('activeQuizResultKey', `quiz_result_${decodedName}`);
    localStorage.removeItem(`quiz_progress_${decodedName}`);
    
    navigate(`/quiz-results?quiz=${encodeURIComponent(decodedName)}`);
  };

  const autoSubmit = () => {
    alert('Time is up! Submitting your quiz...');
    submitQuiz();
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quizData.questions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentQ = quizData.questions[currentQuestion];
  const displayName = getDecodedQuizName() || 'Quiz';

  // 🔥 Access Denied State - Premium content
  if (accessDenied && paperInfo && !paperInfo.isFree) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-yellow-500 text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Premium Content</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This quiz is only available for premium subscribers.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {paperInfo.displayName}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/pricing', { state: { from: `/quiz/${encodeURIComponent(paperInfo.originalName)}` } })}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700"
          >
            Subscribe {paperInfo.displayPrice}
          </button>
          <button
            onClick={() => navigate('/quizzes')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading quiz...</p>
      </div>
    );
  }

  if (error || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Quiz Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'No questions available for this quiz.'}</p>
        <button onClick={() => navigate('/quizzes')} className="px-6 py-2 bg-purple-600 text-white rounded-lg">
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md p-4 mb-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate max-w-md">
            {displayName}
          </h2>
          <div className="text-xl font-bold text-white bg-purple-600 px-4 py-1 rounded-full">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
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
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {currentQuestion === totalQuestions - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sticky top-24">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Question Navigation</h3>
              
              <div className="mb-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <span>Answered: {answeredCount}</span>
                <span>Marked: {Object.keys(markedQuestions).length}</span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {quizData.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => gotoQuestion(idx)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition ${
                      currentQuestion === idx
                        ? 'bg-purple-600 text-white'
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
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Submit Quiz?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have answered {answeredCount} out of {totalQuestions} questions.
              {totalQuestions - answeredCount > 0 && ` ${totalQuestions - answeredCount} questions remain unanswered.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg">
                Continue
              </button>
              <button onClick={submitQuiz} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizExamPage;