import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import '../styles/Navbar.css';

const Navbar = ({ 
  onFeaturesClick, 
  onHowToStartClick, 
  onAboutUsClick, 
  onGetStartedClick,
  activeSection = 'hero'
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll events to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleClick = (clickHandler) => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    clickHandler();
  };
  
  // Determine which button is active based on the activeSection
  const isActive = (section) => activeSection === section ? 'active' : '';
  
  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${activeSection}`}>
      <div className="nav-content">
        <div className="logo" onClick={() => handleClick(onGetStartedClick)}>
          Quizzora
        </div>
        
        {/* Desktop menu */}
        <div className="nav-links desktop-menu">
          <button 
            onClick={() => handleClick(onFeaturesClick)}
            className={isActive('features')}
          >
            Features
          </button>
          <button
            onClick={() => handleClick(onHowToStartClick)}
            className={isActive('howToStart')}
          >
            How to Start
          </button>
          <button
            onClick={() => handleClick(onAboutUsClick)}
            className={isActive('aboutUs')}
          >
            About Us
          </button>
          <button
            onClick={() => handleClick(onGetStartedClick)}
            className="get-started-btn"
          >
            Get Started
          </button>
        </div>
        
        {/* Mobile menu button */}
        <div className="mobile-menu-button">
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <HiX className="icon" aria-hidden="true" />
            ) : (
              <HiMenuAlt3 className="icon" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <button
          onClick={() => handleClick(onFeaturesClick)}
          className={isActive('features')}
        >
          Features
        </button>
        <button
          onClick={() => handleClick(onHowToStartClick)}
          className={isActive('howToStart')}
        >
          How to Start
        </button>
        <button
          onClick={() => handleClick(onAboutUsClick)}
          className={isActive('aboutUs')}
        >
          About Us
        </button>
        <button
          onClick={() => handleClick(onGetStartedClick)}
          className="get-started-btn"
        >
          Get Started
        </button>
      </div>
    </nav>
  );
};

export default Navbar;