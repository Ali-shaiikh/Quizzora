import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiLink, HiUpload, HiDocumentText, HiExclamationCircle } from 'react-icons/hi';

const UploadSection = () => {
  // State management
  const [videoLink, setVideoLink] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const handleVideoLinkChange = (e) => {
    setVideoLink(e.target.value);
  };
  
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size too large. Maximum size is 100MB.');
        return;
      }
      
      // Check file type
      const validTypes = ['.pdf', 'audio/', 'video/'];
      const isValidType = validTypes.some(type => 
        file.type.startsWith(type) || file.name.toLowerCase().endsWith(type)
      );
      
      if (!isValidType) {
        setError('Invalid file type. Please upload a PDF, audio, or video file.');
        return;
      }
      
      setUploadedFile(file);
      setError(''); // Clear any previous errors
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Simulate progress for better UX
  const simulateProgress = () => {
    setLoadingProgress(0);
    const interval = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prevProgress + Math.random() * 10;
      });
    }, 1000);
    
    return interval;
  };
  
  const pollStatus = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/status/${taskId}`);
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'An error occurred while processing');
      }
      
      if (data.status === 'completed') {
        return { completed: true, summary: data.summary };
      }
      
      // Update progress
      setLoadingProgress(data.progress * 100);
      setError(''); // Clear any previous errors
      return { completed: false };
    } catch (error) {
      console.error('Status check error:', error);
      throw new Error(`Error checking status: ${error.message}`);
    }
  };
  
  const handleGenerateSummary = async () => {
    try {
      setError('');
      setIsLoading(true);
      setLoadingProgress(0);
      
      let response;
      let sourceName = "";
      
      if (uploadedFile) {
        // Handle file upload
        sourceName = uploadedFile.name;
        const formData = new FormData();
        formData.append('file', uploadedFile);
        
        response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        });
        
      } else if (videoLink) {
        // Handle YouTube URL
        sourceName = "YouTube Video";
        response = await fetch('http://localhost:8000/api/youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: videoLink }),
        });
      } else {
        setError('Please provide a YouTube URL or upload a file');
        setIsLoading(false);
        return;
      }
      
      // Parse the initial response
      const data = await response.json();
      
      // Check for immediate errors
      if (data.error) {
        throw new Error(data.error);
      }
      
      // If we got a cached result, use it immediately
      if (data.fromCache && data.summary) {
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          navigate('/summary', { 
            state: { 
              summary: data.summary,
              source: sourceName
            } 
          });
        }, 1000);
        return;
      }
      
      // If we got a task ID, start polling
      if (data.taskId) {
        const pollInterval = setInterval(async () => {
          try {
            const statusResult = await pollStatus(data.taskId);
            if (statusResult.completed) {
              clearInterval(pollInterval);
              setLoadingProgress(100);
              setTimeout(() => {
                setIsLoading(false);
                navigate('/summary', { 
                  state: { 
                    summary: statusResult.summary,
                    source: sourceName
                  } 
                });
              }, 1000);
            }
          } catch (error) {
            clearInterval(pollInterval);
            throw error;
          }
        }, 2000); // Poll every 2 seconds
      }
      
    } catch (error) {
      setError(error.message || 'An error occurred connecting to the backend. Please ensure backend server is running.');
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };
  
  return (
    <section className="py-16 bg-light" id="upload-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-secondary mb-8">
            Start Summarizing and Creating Quizzes
          </h2>
          
          <div className="space-y-6">
            {/* YouTube Link Input */}
            <div>
              <label htmlFor="youtube-link" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video Link
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiLink className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="youtube-link"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Paste YouTube URL here..."
                  value={videoLink}
                  onChange={handleVideoLinkChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink px-4 text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload File (PDF, Audio, or Video)
              </label>
              <div 
                onClick={handleUploadClick}
                className={`border-2 border-dashed border-gray-300 rounded-md py-6 flex flex-col justify-center items-center ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,audio/*,video/*"
                  disabled={isLoading}
                />
                {uploadedFile ? (
                  <div className="flex items-center space-x-2 text-primary">
                    <HiDocumentText className="h-6 w-6" />
                    <span className="font-medium">{uploadedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <HiUpload className="h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, Audio, or Video files
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start">
                <HiExclamationCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* Generate Summary Button */}
            <div className="pt-4">
              <button
                onClick={handleGenerateSummary}
                disabled={isLoading || (!videoLink && !uploadedFile)}
                className={`w-full py-3 px-4 rounded-md font-medium text-white 
                  ${(!videoLink && !uploadedFile) || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-purple-700'}`}
              >
                {isLoading ? 'Generating...' : 'Generate Summary'}
              </button>
              
              {isLoading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.round(loadingProgress)}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Analyzing content... {Math.round(loadingProgress)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UploadSection;