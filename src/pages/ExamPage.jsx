import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamData, logExamResult } from '../services/mockTestService';
import { logMockTestResult } from '../services/loggerService'; // STEP 7: Import logger service

function ExamPage() {
  const { examName } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState({ questions: [], config: {} });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examStartTime, setExamStartTime] = useState(null);

  useEffect(() => {
    loadExam();
    return () => {
      // Cleanup
      if (examStartTime) {
        saveProgressToLocal();
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
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
    const decodedName = decodeURIComponent(examName);
    const data = await getExamData(decodedName);
    setExamData(data);
    setTimeLeft(data.config.Duration * 60);
    setExamStartTime(Date.now());
    
    // Load saved progress if any
    const saved = localStorage.getItem(`exam_progress_${decodedName}`);
    if (saved) {
      const progress = JSON.parse(saved);
      setAnswers(progress.answers || {});
      setMarkedQuestions(progress.markedQuestions || {});
      setCurrentQuestion(progress.currentQuestion || 0);
      const elapsed = Math.floor((Date.now() - progress.startTime) / 1000);
      setTimeLeft(Math.max(0, (data.config.Duration * 60) - elapsed));
    }
    
    setLoading(false);
  };

  const saveProgressToLocal = () => {
    const decodedName = decodeURIComponent(examName);
    localStorage.setItem(`exam_progress_${decodedName}`, JSON.stringify({
      answers,
      markedQuestions,
      currentQuestion,
      startTime: examStartTime
    }));
  };

  const formatTime = (seconds) => {
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
    const decodedName = decodeURIComponent(examName);
    
    // STEP 7: Log mock test result using the new logger service
    const resultPayload = {
      testName: decodedName,
      totalQuestions: results.totalQuestions,
      correct: results.correct,
      incorrect: results.incorrect,
      unanswered: results.unanswered,
      score: results.correct,
      timeTaken: results.timeTaken
    };
    
    // Log to Google Sheets using loggerService (STEP 7)
    await logMockTestResult(resultPayload);
    
    // Also maintain the original logging for backward compatibility
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
    
    // Save to localStorage for results page
    localStorage.setItem(`exam_result_${decodedName}`, JSON.stringify(examResultPayload));
    localStorage.setItem('activeResultKey', `exam_result_${decodedName}`);
    
    // Log using the existing service (optional, for backward compatibility)
    await logExamResult(examResultPayload, 'mock');
    
    // Clear progress
    localStorage.removeItem(`exam_progress_${decodedName}`);
    
    // Redirect to results page
    navigate(`/mock-test-results?exam=${encodeURIComponent(decodedName)}`);
  };

  const autoSubmit = () => {
    alert('Time is up! Submitting your exam...');
    submitExam();
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData.questions.length;
  const progressPercent = (answeredCount / totalQuestions) * 100;
  const currentQ = examData.questions[currentQuestion];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md p-4 mb-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
            {decodeURIComponent(examName)}
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