// src/pages/QuizResultsPage.jsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getQuizData } from '../services/quizService';
import { CheckCircle, XCircle, AlertCircle, Clock, Printer, RotateCcw } from 'lucide-react';

function QuizResultsPage() {
  const [searchParams] = useSearchParams();
  const quizName = searchParams.get('quiz');
  const [results, setResults] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadResults(); }, [quizName]);

  const loadResults = async () => {
    if (!quizName) return;
    const decodedName = decodeURIComponent(quizName);
    const savedResult = localStorage.getItem(`quiz_result_${decodedName}`);
    if (!savedResult) { setLoading(false); return; }
    
    const resultData = JSON.parse(savedResult);
    const quizData = await getQuizData(decodedName);
    setQuestions(quizData.questions);
    setConfig(quizData.config);
    setResults(resultData);
    setLoading(false);
  };

  const formatText = (text) => {
    if (!text) return '';
    return String(text).replace(/\^\^([^\^]+)\^\^/g, '<sub>$1</sub>').replace(/\^([^\^]+)\^?/g, '<sup>$1</sup>').replace(/\r?\n/g, '<br>');
  };

  const calculateTotalScore = () => {
    if (!results) return { score: 0, maxTotal: 0 };
    const pos = config.PositiveMark || 1;
    const neg = config.NegativeMark || 0;
    const total = (results.score * pos) - ((results.answeredCount - results.score) * neg);
    const maxTotal = results.totalQuestions * pos;
    return { score: Math.max(0, total).toFixed(2), maxTotal };
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">No results found. Take a quiz first.</p>
        <Link to="/quizzes" className="inline-block mt-4 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm">Browse Quizzes</Link>
      </div>
    );
  }

  const totalScore = calculateTotalScore();

  return (
    <div className="py-4 md:py-6 max-w-4xl mx-auto px-3">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 break-words">{quizName}</h1>
        <p className="text-xs text-gray-500">Your Quiz Results</p>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div><div className="text-xl font-bold text-gray-800">{totalScore.score}</div><div className="text-[10px] text-gray-500">Score / {totalScore.maxTotal}</div></div>
          <div><div className="text-xl font-bold text-green-600">{results.score}</div><div className="text-[10px] text-gray-500">Correct</div></div>
          <div><div className="text-xl font-bold text-red-600">{results.answeredCount - results.score}</div><div className="text-[10px] text-gray-500">Incorrect</div></div>
          <div><div className="text-xl font-bold text-yellow-600">{results.unansweredCount}</div><div className="text-[10px] text-gray-500">Unanswered</div></div>
          <div className="col-span-2 md:col-span-1"><div className="text-xl font-bold text-blue-600">{Math.floor(results.timeTaken / 60)} min</div><div className="text-[10px] text-gray-500">Time Taken</div></div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <h2 className="text-base font-bold text-gray-800 mb-3">Detailed Analysis</h2>
      
      <div className="space-y-3">
        {questions.map((question, idx) => {
          const userAnswer = results.answers[idx];
          const isCorrect = userAnswer === question.correct;
          const isAnswered = userAnswer !== undefined;
          
          let statusClass = '', statusIcon = null, statusText = '';
          if (!isAnswered) { statusClass = 'border-yellow-500 bg-yellow-50'; statusIcon = <AlertCircle size={14} className="text-yellow-500" />; statusText = 'Not Answered'; }
          else if (isCorrect) { statusClass = 'border-green-500 bg-green-50'; statusIcon = <CheckCircle size={14} className="text-green-500" />; statusText = 'Correct'; }
          else { statusClass = 'border-red-500 bg-red-50'; statusIcon = <XCircle size={14} className="text-red-500" />; statusText = 'Incorrect'; }
          
          return (
            <div key={idx} className={`border-l-4 rounded-lg p-3 ${statusClass}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">Question {idx + 1}</h3>
                <span className={`flex items-center gap-1 text-xs ${!isAnswered ? 'text-yellow-600' : isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {statusIcon} {statusText}
                </span>
              </div>
              <p className="text-gray-700 text-xs mb-2" dangerouslySetInnerHTML={{ __html: formatText(question.text) }} />
              <div className="space-y-1 text-xs">
                {['A', 'B', 'C', 'D'].map(opt => {
                  let optClass = '';
                  if (opt === question.correct) optClass = 'bg-green-100 text-green-800';
                  if (isAnswered && opt === userAnswer && opt !== question.correct) optClass = 'bg-red-100 text-red-800';
                  return (
                    <div key={opt} className={`p-1.5 rounded ${optClass}`}>
                      <strong>{opt})</strong> {question.options[opt]}
                      {opt === question.correct && ' ✓'}
                      {isAnswered && opt === userAnswer && opt !== question.correct && ' (Your answer)'}
                    </div>
                  );
                })}
              </div>
              {question.notes && (
                <div className="mt-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
                  <strong>Explanation:</strong> {question.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center mt-6">
        <Link to="/quizzes" className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"><RotateCcw size={14} /> Take Another Quiz</Link>
        <button onClick={() => window.print()} className="px-5 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"><Printer size={14} /> Print</button>
      </div>
    </div>
  );
}

export default QuizResultsPage;