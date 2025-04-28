
import React, { useEffect, useRef } from 'react';
import '../styles/Hero.css';

const Hero = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];
    let animationFrameId;

    
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();

    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 65%)`;
        this.alpha = Math.random() * 0.5 + 0.1; // Lower alpha for subtlety
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Boundary check
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        // Mouse interaction
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const angle = Math.atan2(dy, dx);
          this.speedX += Math.cos(angle) * 0.1;
          this.speedY += Math.sin(angle) * 0.1;
        }
        
        // Speed limit
        this.speedX = Math.max(-3, Math.min(3, this.speedX));
        this.speedY = Math.max(-3, Math.min(3, this.speedY));
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const init = () => {
      for (let i = 0; i < 70; i++) { // Reduced number of particles
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a subtle gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(245, 247, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(235, 240, 255, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="hero-container">
      <canvas ref={canvasRef} className="hero-canvas"></canvas>
      <div className="hero-content">
        <div className="hero-text">
          <h1>
            Transform Content into <span className="highlight">Knowledge</span> with AI
          </h1>
          <p>
            Quizzora helps you summarize videos, PDFs, and audio files, then 
            generates interactive quizzes to reinforce your learning.
          </p>
          <button className="get-started-btn">Get Started Now</button>
        </div>
        <div className="hero-illustration">
          <div className="illustration-card">
            <div className="illustration-icon"></div>
            <div className="illustration-line"></div>
            <div className="illustration-line"></div>
            <div className="illustration-line"></div>
          </div>
          <div className="ai-badge">AI</div>
          <div className="accent-circle"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;