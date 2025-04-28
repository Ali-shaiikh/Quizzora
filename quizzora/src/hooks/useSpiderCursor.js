// hooks/useSpiderCursor.js
import { useEffect, useRef } from 'react';

const useSpiderCursor = (enabled = true) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.style.opacity = '0.6'; // Reduced opacity for subtlety
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const spiders = [];
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    class Spider {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = 0;
        this.speedY = 0;
        this.history = [];
        this.maxLength = 20;
        this.angle = 0;
      }
      
      update() {
        // Calculate direction to mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          this.speedX = dx * 0.1;
          this.speedY = dy * 0.1;
        } else {
          this.speedX *= 0.95;
          this.speedY *= 0.95;
        }
        
        this.angle = Math.atan2(dy, dx);
        
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Store history for trail
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxLength) {
          this.history.shift();
        }
      }
      
      draw() {
        // Draw trail
        ctx.beginPath();
        for (let i = 0; i < this.history.length; i++) {
          const point = this.history[i];
          const alpha = i / this.history.length;
          ctx.strokeStyle = `rgba(103, 78, 234, ${alpha * 0.5})`;
          ctx.lineWidth = this.size * alpha;
          
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.stroke();
        
        // Draw spider body
        ctx.fillStyle = '#674eea';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw legs
        const legLength = this.size * 4;
        
        for (let i = 0; i < 4; i++) {
          const angle1 = this.angle + (Math.PI / 4) * i;
          const angle2 = this.angle - (Math.PI / 4) * i;
          
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(
            this.x + Math.cos(angle1) * legLength,
            this.y + Math.sin(angle1) * legLength
          );
          ctx.strokeStyle = 'rgba(103, 78, 234, 0.8)';
          ctx.lineWidth = this.size * 0.5;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(
            this.x + Math.cos(angle2) * legLength,
            this.y + Math.sin(angle2) * legLength
          );
          ctx.strokeStyle = 'rgba(103, 78, 234, 0.8)';
          ctx.lineWidth = this.size * 0.5;
          ctx.stroke();
        }
      }
    }
    
    // Create spiders
    for (let i = 0; i < 2; i++) {
      spiders.push(new Spider());
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw subtle glow effect around cursor
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 5,
        mouse.x, mouse.y, 80
      );
      gradient.addColorStop(0, 'rgba(103, 78, 234, 0.2)');
      gradient.addColorStop(1, 'rgba(103, 78, 234, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw spiders
      spiders.forEach(spider => {
        spider.update();
        spider.draw();
      });
      
      requestAnimationFrame(animate);
    };
    
    const handleMouseMove = (e) => {
      mouse = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    animate();
    
    canvasRef.current = canvas;
    
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeChild(canvas);
    };
  }, [enabled]);
  
  return canvasRef;
};

export default useSpiderCursor;