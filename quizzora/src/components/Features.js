import React, { useEffect, useRef } from 'react';
import { HiOutlineDocumentSearch, HiOutlinePencilAlt, HiOutlineSave, HiOutlineDownload } from 'react-icons/hi';
import '../styles/Features.css';

const Features = () => {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    cardsRef.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      cardsRef.current.forEach((card) => {
        if (card) {
          observer.unobserve(card);
        }
      });
    };
  }, []);

  const features = [
    {
      icon: <HiOutlineDocumentSearch className="feature-icon" />,
      title: 'Smart Summarization',
      description: 'Extract key points from YouTube videos, PDFs, audio, and video files with our AI-powered summarization engine.'
    },
    {
      icon: <HiOutlinePencilAlt className="feature-icon" />,
      title: 'Automatic Quiz Generation',
      description: 'Create custom quizzes based on the content to test your knowledge and enhance learning retention.'
    },
    {
      icon: <HiOutlineSave className="feature-icon" />,
      title: 'Save & Export',
      description: 'Save your summaries and quizzes for future reference or share them with others in convenient formats.'
    },
    {
      icon: <HiOutlineDownload className="feature-icon" />,
      title: 'Multiple Content Sources',
      description: 'Process content from various sources including YouTube videos, PDF documents, and media files.'
    }
  ];

  return (
    <section className="features-section" id="features" ref={sectionRef}>
      <div className="features-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
      
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">Features</h2>
          <p className="features-subtitle">
            Quizzora comes packed with powerful features to help you learn more efficiently
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              ref={(el) => (cardsRef.current[index] = el)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-container">
                {feature.icon}
                <div className="icon-ring"></div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="card-shine"></div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="features-dots">
        {[...Array(12)].map((_, i) => (
          <div 
            className="feature-dot" 
            key={i} 
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`
            }}
          ></div>
        ))}
      </div>
    </section>
  );
};

export default Features;