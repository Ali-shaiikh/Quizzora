import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { HiDownload, HiLightningBolt } from 'react-icons/hi';

const Summary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  
  const summary = location.state?.summary || "No summary data available. Please generate a summary first.";
  const source = location.state?.source || "Unknown source";
  
  
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const handleSaveSummary = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `quizzora-summary-${new Date().toISOString().slice(0, 10)}.txt`);
  };
  
  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for quiz generation');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('topic', topic);
      
      console.log('Sending request to generate quiz for topic:', topic);
      
      const response = await fetch('http://localhost:8000/api/generate_quiz', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      console.log('Received quiz data from backend:', data);
      
      if (data.error) {
        console.error('Error from backend:', data.error);
        setError(data.error);
        setIsGenerating(false);
        return;
      }
      
      setIsGenerating(false);
      
      // Navigate to quiz page with the generated quiz data
      const quizState = {
        summary,
        source,
        quiz: data.quiz || [],
        shortAnswers: data.shortAnswers || [],
        rawQuizData: data
      };
      
      console.log('Navigating to quiz with state:', quizState);
      
      navigate('/quiz', { state: quizState });
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz. Please try again.');
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-secondary">Content Summary</h1>
              <div className="text-sm text-gray-500">Source: {source}</div>
            </div>
            
            <div className="prose max-w-none">
              <div className="bg-light p-6 rounded-lg border border-gray-200 whitespace-pre-wrap">
                {summary}
              </div>
            </div>
            
            {/* Topic input for quiz generation */}
            <div className="mt-6">
              <label htmlFor="quiz-topic" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Topic for Quiz Generation
              </label>
              <input
                type="text"
                id="quiz-topic"
                className="focus:ring-primary focus:border-primary block w-full p-3 sm:text-sm border border-gray-300 rounded-md"
                placeholder="E.g., Climate Change, Machine Learning, History of Rome..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-4">
              <button
                onClick={handleSaveSummary}
                className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                <HiDownload className="h-5 w-5" />
                Save Summary
              </button>
              
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-white bg-primary hover:bg-purple-700 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <HiLightningBolt className="h-5 w-5" />
                {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
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

export default Summary;