import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Summary from './pages/Summary';
import Quiz from './pages/Quiz';
import useSpiderCursor from './hooks/useSpiderCursor';
import './styles/Transitions.css';
import './App.css';


const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const spiderCursorRef = useSpiderCursor(isHomePage);

  
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`page-${location.pathname.substring(1) || 'home'}`);
    
    
    window.scrollTo(0, 0);
  }, [location]);
  
  return (
    <div className={`app-container ${isHomePage ? 'home-page' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;