import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getQuizData } from '../services/quizService';

function QuizResultsPage() {
  const [searchParams] = useSearchParams();
  const quizName = searchParams.get('quiz');
  const [results, setResults] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [quizName]);

  const loadResults = async () => {
    if (!quizName) return;
    
    const decodedName = decodeURIComponent(quizName);
    const savedResult = localStorage.getItem(`quiz_result_${decodedName}`);
    
    if (!savedResult) {
      setLoading(false);
      return;
    }
    
    const resultData = JSON.parse(savedResult);
    
    // Load questions for reference
    const quizData = await getQuizData(decodedName);
    setQuestions(quizData.questions);
    setConfig(quizData.config);
    setResults(resultData);
    setLoading(false);
  };

  const formatText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/\^\^([^\^]+)\^\^/g, '<sub>$1</sub>')
      .replace(/\^([^\^]+)\^?/g, '<sup>$1</sup>')
      .replace(/\r?\n/g, '<br>');
  };

  const calculateTotalScore = () => {
    if (!results) return 0;
    const pos = config.PositiveMark || 1;
    const neg = config.NegativeMark || 0;
    const total = (results.score * pos) - ((results.answeredCount - results.score) * neg);
    const maxTotal = results.totalQuestions * pos;
    return { score: Math.max(0, total).toFixed(2), maxTotal };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">No results found. Please take a quiz first.</p>
        <Link to="/quizzes" className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg">
          Browse Quizzes
        </Link>
      </div>
    );
  }

  const totalScore = calculateTotalScore();

  return (
    <div className="py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {quizName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Your Quiz Results</p>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{totalScore.score}</div>
            <div className="text-sm text-gray-500">Score / {totalScore.maxTotal}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{results.score}</div>
            <div className="text-sm text-gray-500">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{results.answeredCount - results.score}</div>
            <div className="text-sm text-gray-500">Incorrect</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{results.unansweredCount}</div>
            <div className="text-sm text-gray-500">Unanswered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{Math.floor(results.timeTaken / 60)} min</div>
            <div className="text-sm text-gray-500">Time Taken</div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Detailed Analysis
      </h2>
      
      <div className="space-y-6">
        {questions.map((question, idx) => {
          const userAnswer = results.answers[idx];
          const isCorrect = userAnswer === question.correct;
          const isAnswered = userAnswer !== undefined;
          
          let statusClass = '';
          let statusText = '';
          if (!isAnswered) {
            statusClass = 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
            statusText = 'Not Answered';
          } else if (isCorrect) {
            statusClass = 'border-green-500 bg-green-50 dark:bg-green-900/10';
            statusText = 'Correct ✓';
          } else {
            statusClass = 'border-red-500 bg-red-50 dark:bg-red-900/10';
            statusText = 'Incorrect ✗';
          }
          
          return (
            <div key={idx} className={`border-l-4 rounded-lg p-4 ${statusClass}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Question {idx + 1}
                </h3>
                <span className={`text-sm font-medium ${
                  !isAnswered ? 'text-yellow-600' : isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {statusText}
                </span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-3" 
                 dangerouslySetInnerHTML={{ __html: formatText(question.text) }} />
              
              <div className="space-y-1 text-sm">
                {['A', 'B', 'C', 'D'].map(opt => {
                  let optClass = '';
                  if (opt === question.correct) optClass = 'bg-green-100 dark:bg-green-900/30 text-green-800';
                  if (isAnswered && opt === userAnswer && opt !== question.correct) 
                    optClass = 'bg-red-100 dark:bg-red-900/30 text-red-800';
                  
                  return (
                    <div key={opt} className={`p-2 rounded ${optClass}`}>
                      <strong>{opt})</strong> {question.options[opt]}
                      {opt === question.correct && ' ✓'}
                      {isAnswered && opt === userAnswer && opt !== question.correct && ' (Your answer)'}
                    </div>
                  );
                })}
              </div>
              
              {question.notes && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  <strong>Explanation:</strong> {question.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mt-8">
        <Link
          to="/quizzes"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
        >
          Take Another Quiz
        </Link>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
        >
          Print Results
        </button>
      </div>
    </div>
  );
}

export default QuizResultsPage;