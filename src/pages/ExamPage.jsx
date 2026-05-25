// src/pages/ExamPage.jsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getExamData, getAllPapers } from '../services/mockTestService';
import { logMockTestResult } from '../services/loggerService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Clock, CheckCircle, XCircle, AlertCircle, Flag, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [checkingAccess, setCheckingAccess] = useState(true);

  const getDecodedExamName = () => {
    let decoded = examName ? decodeURIComponent(examName) : null;
    if (!decoded) {
      const sheetParam = searchParams.get('sheet');
      if (sheetParam) decoded = decodeURIComponent(sheetParam);
    }
    return decoded;
  };

  const checkPurchasedMockTest = async (userId, testId) => {
    if (!userId) return false;
    console.log('🔍 Checking purchase for mock test:', { userId, testId });
    
    try {
      // ✅ FIRST check D1
      const { checkPurchasedInD1 } = await import('../services/d1Service');
      const d1Result = await checkPurchasedInD1(userId, testId);
      console.log('📦 D1 purchase check result:', d1Result);
      
      if (d1Result.success && d1Result.purchased) {
        console.log('✅ Mock test found in D1 purchases');
        return true;
      }
      
      // ✅ FALLBACK to Firestore (for old purchases)
      const userDoc = await getDoc(doc(db, 'users', userId));
      const purchasedMockTests = userDoc.data()?.purchasedMockTests || [];
      console.log('📦 Firestore purchasedMockTests:', purchasedMockTests);
      
      const isPurchased = purchasedMockTests === 'all' || 
                          (Array.isArray(purchasedMockTests) && purchasedMockTests.includes(testId));
      
      if (isPurchased) {
        console.log('✅ Mock test found in Firestore purchases');
      }
      
      return isPurchased;
    } catch (error) {
      console.error('Error checking purchased mock test:', error);
      return false;
    }
  };

  const checkAccess = async (decodedName) => {
    setCheckingAccess(true);
    try {
      const papers = await getAllPapers();
      const paper = papers.find(p => p.originalName === decodedName);
      setPaperInfo(paper);
      
      if (!paper) { setError('Exam not found'); setCheckingAccess(false); return false; }
      if (paper.isFree) { setCheckingAccess(false); return true; }
      if (isSubscribed) { setCheckingAccess(false); return true; }
      if (!user) { setAccessDenied(true); setCheckingAccess(false); return false; }
      
      const purchased = await checkPurchasedMockTest(user.uid, paper.id);
      if (purchased) { setCheckingAccess(false); return true; }
      
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
      if (!decodedName) { setError('No exam specified'); setLoading(false); setCheckingAccess(false); return; }
      
      const hasAccess = await checkAccess(decodedName);
      if (hasAccess) await loadExam();
      else setLoading(false);
    };
    init();
    return () => { if (examStartTime) saveProgressToLocal(); };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timer); autoSubmit(); return 0; }
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
    if (!decodedName) { setError('No exam specified'); setLoading(false); return; }
    
    try {
      const data = await getExamData(decodedName);
      if (!data.questions || data.questions.length === 0) { setError('No questions found.'); setLoading(false); return; }
      
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
        } catch (e) { console.error('Error parsing saved progress:', e); }
      }
    } catch (err) {
      console.error('Error loading exam:', err);
      setError(err.message || 'Failed to load exam');
    } finally { setLoading(false); }
  };

  const saveProgressToLocal = () => {
    const decodedName = getDecodedExamName();
    if (decodedName && examStartTime) {
      localStorage.setItem(`exam_progress_${decodedName}`, JSON.stringify({
        answers, markedQuestions, currentQuestion, startTime: examStartTime
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
    setMarkedQuestions(prev => ({ ...prev, [currentQuestion]: !prev[currentQuestion] }));
    saveProgressToLocal();
  };

  const nextQuestion = () => {
    if (currentQuestion < examData.questions.length - 1) setCurrentQuestion(prev => prev + 1);
    else setShowSubmitModal(true);
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(prev => prev - 1);
  };

  const gotoQuestion = (index) => setCurrentQuestion(index);

  const calculateResults = () => {
    let correct = 0, incorrect = 0, unanswered = 0;
    examData.questions.forEach((q, i) => {
      const userAns = answers[i];
      if (!userAns) unanswered++;
      else if (userAns === q.correct) correct++;
      else incorrect++;
    });
    const timeTaken = Math.floor((Date.now() - examStartTime) / 60000);
    return { correct, incorrect, unanswered, totalQuestions: examData.questions.length, timeTaken };
  };

  // ✅ FIXED: Only log once - removed duplicate logExamResult call
  const submitExam = async () => {
    const results = calculateResults();
    const decodedName = getDecodedExamName();
    if (!decodedName) return;
    
    // ✅ Only log to Google Sheet once
    await logMockTestResult({
      testName: decodedName,
      totalQuestions: results.totalQuestions,
      correct: results.correct,
      incorrect: results.incorrect,
      unanswered: results.unanswered,
      score: results.correct,
      timeTaken: results.timeTaken
    });
    
    const examResultPayload = {
      score: results.correct,
      answeredCount: results.correct + results.incorrect,
      unansweredCount: results.unanswered,
      totalQuestions: results.totalQuestions,
      timeTaken: results.timeTaken,
      answers: answers,
      config: examData.config
    };
    
    localStorage.setItem(`exam_result_${decodedName}`, JSON.stringify(examResultPayload));
    localStorage.setItem('activeResultKey', `exam_result_${decodedName}`);
    
    // ❌ REMOVED: await logExamResult(examResultPayload, 'mock'); - this was causing duplicates
    
    localStorage.removeItem(`exam_progress_${decodedName}`);
    navigate(`/mock-test-results?exam=${encodeURIComponent(decodedName)}`);
  };

  const autoSubmit = () => { alert('Time is up! Submitting your exam...'); submitExam(); };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData.questions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentQ = examData.questions[currentQuestion];
  const displayName = getDecodedExamName() || 'Exam';

  // Access Denied State
  if (accessDenied && paperInfo && !paperInfo.isFree && !checkingAccess) {
    if (!user) {
      return (
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="text-yellow-500 text-5xl mb-3">🔒</div>
          <h2 className="text-lg font-semibold mb-2">Login Required</h2>
          <p className="text-sm text-gray-500 mb-5">Please login to access this mock test.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/login', { state: { from: `/mock-test/${encodeURIComponent(paperInfo.originalName)}` } })} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm">Login Now</button>
            <button onClick={() => navigate('/mock-tests')} className="px-5 py-2 bg-gray-500 text-white rounded-lg text-sm">Back</button>
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <div className="text-yellow-500 text-5xl mb-3">🔒</div>
        <h2 className="text-lg font-semibold mb-2">Premium Content</h2>
        <p className="text-sm text-gray-500 mb-5">Subscribe or purchase to access this mock test.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate('/pricing')} className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm">Subscribe</button>
          <button onClick={() => navigate('/mock-tests')} className="px-5 py-2 bg-gray-500 text-white rounded-lg text-sm">Back</button>
        </div>
      </div>
    );
  }

  if (loading || checkingAccess) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (error || !examData.questions || examData.questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <p className="text-gray-500 text-sm mb-5">{error || 'No questions found'}</p>
        <button onClick={() => navigate('/mock-tests')} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm">Back to Tests</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md p-3 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-800 truncate max-w-[60%]">{displayName}</h2>
        <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          <Clock size={14} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Question Section */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="mb-3 pb-2 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">Q{currentQuestion + 1}/{totalQuestions}</span>
                <button onClick={markQuestion} className={`text-xs px-2 py-1 rounded-lg ${markedQuestions[currentQuestion] ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  <Flag size={12} className="inline mr-1" /> {markedQuestions[currentQuestion] ? 'Marked' : 'Mark'}
                </button>
              </div>
              
              <p className="text-gray-800 text-sm mb-4" dangerouslySetInnerHTML={{ __html: formatText(currentQ?.text) }} />
              
              {currentQ?.image && <img src={currentQ.image} alt="Question" className="max-w-full max-h-48 my-3 rounded-lg" />}
              
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => selectOption(opt)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                      answers[currentQuestion] === opt
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <strong>{opt})</strong>{' '}
                    <span dangerouslySetInnerHTML={{ __html: formatText(currentQ?.options?.[opt]) }} />
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button onClick={previousQuestion} disabled={currentQuestion === 0} className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm disabled:opacity-50">Prev</button>
                <button onClick={nextQuestion} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
                  {currentQuestion === totalQuestions - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Navigation Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm p-3 sticky top-20">
              <div className="flex justify-between text-xs mb-2">
                <span>Answered: {answeredCount}</span>
                <span>Marked: {Object.keys(markedQuestions).length}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {examData.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => gotoQuestion(idx)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition ${
                      currentQuestion === idx ? 'bg-blue-600 text-white' :
                      answers[idx] ? 'bg-green-500 text-white' :
                      markedQuestions[idx] ? 'bg-yellow-500 text-white' :
                      'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowSubmitModal(true)} className="w-full mt-3 py-2 bg-red-500 text-white rounded-lg text-sm">Submit Exam</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2 md:hidden">
        <button onClick={previousQuestion} disabled={currentQuestion === 0} className="w-10 h-10 bg-gray-700 text-white rounded-full shadow-lg disabled:opacity-50 flex items-center justify-center"><ChevronLeft size={20} /></button>
        <button onClick={nextQuestion} className="w-10 h-10 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center"><ChevronRight size={20} /></button>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-3">Submit Exam?</h3>
            <p className="text-sm text-gray-600 mb-4">You answered {answeredCount} of {totalQuestions} questions.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm">Cancel</button>
              <button onClick={submitExam} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamPage;