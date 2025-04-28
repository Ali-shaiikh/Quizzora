import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowToStart from '../components/HowToStart';
import AboutUs from '../components/AboutUs';
import Footer from '../components/Footer';
import UploadSection from '../components/UploadSection';

const Home = () => {
  const [videoLink, setVideoLink] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const featuresRef = useRef(null);
  const howToStartRef = useRef(null);
  const aboutUsRef = useRef(null);
  const uploadSectionRef = useRef(null);
  
  const navigate = useNavigate();
  
  const handleFileUpload = (file) => {
    setUploadedFile(file);
  };
  
  const handleVideoLinkChange = (e) => {
    setVideoLink(e.target.value);
  };
  
  const handleGenerateSummary = () => {
    if (!videoLink && !uploadedFile) {
      alert('Please provide a YouTube link or upload a file');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          // Navigate to summary page with mock data
          navigate('/summary', { 
            state: { 
              summary: "This is a generated summary of the content. It would normally be created by your AI backend based on the video link or uploaded file. The summary provides key points and main ideas from the content, making it easier for users to understand the material without going through the entire content. This summary can then be used to generate quiz questions to test understanding.",
              source: videoLink || uploadedFile?.name
            } 
          });
          return 0;
        }
        return prev + 5;
      });
    }, 200);
  };
  
  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        onFeaturesClick={() => scrollToSection(featuresRef)}
        onHowToStartClick={() => scrollToSection(howToStartRef)}
        onAboutUsClick={() => scrollToSection(aboutUsRef)}
        onGetStartedClick={() => scrollToSection(uploadSectionRef)}
      />
      
      <Hero onGetStartedClick={() => scrollToSection(uploadSectionRef)} />
      
      <div ref={featuresRef}>
        <Features />
      </div>
      
      <div ref={howToStartRef}>
        <HowToStart />
      </div>
      
      <div ref={aboutUsRef}>
        <AboutUs />
      </div>
      
      <div ref={uploadSectionRef}>
        <UploadSection 
          videoLink={videoLink}
          onVideoLinkChange={handleVideoLinkChange}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          onGenerateSummary={handleGenerateSummary}
          isLoading={isLoading}
          loadingProgress={loadingProgress}
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;