import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiDownload, HiDocumentText, HiCheck, HiX } from 'react-icons/hi';

const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  

  const { 
    quiz = [], 
    shortAnswers = [], 
    summary = "", 
    source = "Unknown source",
    rawQuizData = null
  } = location.state || {};
  
  const [selectedAnswers, setSelectedAnswers] = useState(new Array(quiz.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('mcq');
  
  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };
  
  const handleCheckAnswers = () => {
    setShowResults(true);
  };
  
  const handleSaveQuiz = () => {
    
    let quizText = "QUIZZORA GENERATED QUIZ\n";
    quizText += `Source: ${source}\n`;
    quizText += `Date: ${new Date().toLocaleDateString()}\n\n`;
    
    quizText += "MULTIPLE CHOICE QUESTIONS\n";
    quiz.forEach((q, i) => {
      quizText += `${i+1}. ${q.question}\n`;
      q.options.forEach((option, j) => {
        quizText += `   ${String.fromCharCode(97 + j)}) ${option}\n`;
      });
      quizText += `   Correct answer: ${String.fromCharCode(97 + q.answer)}) ${q.options[q.answer]}\n\n`;
    });
    
    quizText += "SHORT ANSWER QUESTIONS\n";
    shortAnswers.forEach((q, i) => {
      quizText += `${i+1}. ${q.question}\n`;
      quizText += `   Sample answer: ${q.sampleAnswer}\n\n`;
    });
    
    const blob = new Blob([quizText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `quizzora-quiz-${new Date().toISOString().slice(0, 10)}.txt`);
  };
  
  const calculateScore = () => {
    let correct = 0;
    selectedAnswers.forEach((selected, index) => {
      if (selected === quiz[index].answer) {
        correct++;
      }
    });
    return `${correct}/${quiz.length}`;
  };
  
  // Handle case where quiz format might be different from expected
  const renderContent = () => {
    if (rawQuizData && rawQuizData.raw_response) {
      return (
        <div className="p-6 bg-light rounded-lg border border-gray-200 whitespace-pre-wrap">
          {rawQuizData.raw_response}
        </div>
      );
    }
    
    if (activeTab === 'mcq') {
      return (
        <div>
          {quiz.length > 0 ? (
            <div>
              {quiz.map((question, qIndex) => (
                <div key={qIndex} className="mb-8 p-6 bg-light rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {qIndex + 1}. {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex} 
                        onClick={() => !showResults && handleAnswerSelect(qIndex, oIndex)}
                        className={`p-3 rounded-md cursor-pointer flex items-center
                          ${selectedAnswers[qIndex] === oIndex ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-white border border-gray-200 hover:border-gray-300'}
                          ${showResults && oIndex === question.answer ? 'bg-green-50 border border-green-500' : ''}
                          ${showResults && selectedAnswers[qIndex] === oIndex && oIndex !== question.answer ? 'bg-red-50 border border-red-500' : ''}
                        `}
                      >
                        <div className="mr-3">
                          {showResults ? (
                            oIndex === question.answer ? (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <HiCheck className="text-white w-4 h-4" />
                              </div>
                            ) : selectedAnswers[qIndex] === oIndex ? (
                              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <HiX className="text-white w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-gray-300"></div>
                            )
                          ) : (
                            <div className={`w-5 h-5 rounded-full ${selectedAnswers[qIndex] === oIndex ? 'bg-primary' : 'border border-gray-300'}`}></div>
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {showResults ? (
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-primary">
                  <p className="font-medium text-secondary">Your score: {calculateScore()}</p>
                </div>
              ) : (
                <div className="mt-6">
                  <button
                    onClick={handleCheckAnswers}
                    className="py-2 px-6 bg-primary text-white rounded-md font-medium hover:bg-purple-700"
                  >
                    Check Answers
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No multiple choice questions available.
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div>
          {shortAnswers.length > 0 ? (
            <div className="space-y-8">
              {shortAnswers.map((item, index) => (
                <div key={index} className="p-6 bg-light rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {index + 1}. {item.question}
                  </h3>
                  <div>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      rows="4"
                      placeholder="Type your answer here..."
                    ></textarea>
                  </div>
                  <div className="mt-4">
                    <details className="rounded-md border border-gray-200">
                      <summary className="px-4 py-2 bg-white cursor-pointer font-medium text-primary">
                        View sample answer
                      </summary>
                      <div className="p-4 bg-indigo-50 border-t border-gray-200">
                        {item.sampleAnswer}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No short answer questions available.
            </div>
          )}
        </div>
      );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-secondary">Generated Quiz</h1>
              <div className="text-sm text-gray-500">Source: {source}</div>
            </div>
            
            {!rawQuizData?.raw_response && (
              <div className="mb-6">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('mcq')}
                    className={`py-2 px-4 font-medium ${activeTab === 'mcq' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => setActiveTab('short')}
                    className={`py-2 px-4 font-medium ${activeTab === 'short' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                  >
                    Short Answer
                  </button>
                </div>
              </div>
            )}
            
            {renderContent()}
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
              <button
                onClick={() => navigate('/summary', { state: { summary, source } })}
                className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                <HiDocumentText className="h-5 w-5" />
                Back to Summary
              </button>
              
              <button
                onClick={handleSaveQuiz}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-white bg-primary hover:bg-purple-700 shadow-sm"
              >
                <HiDownload className="h-5 w-5" />
                Save Quiz
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:text-purple-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Quiz;