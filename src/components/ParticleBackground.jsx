import React, { useEffect, useRef } from 'react';
import './ParticleBackground.css';

/**
 * Composant d'effet de particules de brouillard
 * Optimisé pour les performances avec Canvas
 */
const ParticleBackground = ({ theme, intensity = 'medium' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Ajuster la taille du canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Configuration selon le thème
    const getThemeConfig = () => {
      switch (theme?.id) {
        case 'medieval':
          return {
            particleCount: intensity === 'light' ? 30 : intensity === 'medium' ? 50 : 80,
            color: 'rgba(251, 191, 36, 0.15)', // Amber
            glowColor: 'rgba(251, 191, 36, 0.3)',
            minSize: 20,
            maxSize: 80,
            speed: 0.3
          };
        case 'lovecraft':
          return {
            particleCount: intensity === 'light' ? 40 : intensity === 'medium' ? 60 : 100,
            color: 'rgba(16, 185, 129, 0.1)', // Emerald
            glowColor: 'rgba(16, 185, 129, 0.25)',
            minSize: 30,
            maxSize: 100,
            speed: 0.2
          };
        case 'scifi':
          return {
            particleCount: intensity === 'light' ? 35 : intensity === 'medium' ? 55 : 90,
            color: 'rgba(6, 182, 212, 0.12)', // Cyan
            glowColor: 'rgba(6, 182, 212, 0.3)',
            minSize: 25,
            maxSize: 90,
            speed: 0.4
          };
        default:
          return {
            particleCount: 50,
            color: 'rgba(255, 255, 255, 0.1)',
            glowColor: 'rgba(255, 255, 255, 0.2)',
            minSize: 30,
            maxSize: 80,
            speed: 0.3
          };
      }
    };

    const config = getThemeConfig();

    // Classe Particule
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = config.minSize + Math.random() * (config.maxSize - config.minSize);
        this.speedX = (Math.random() - 0.5) * config.speed;
        this.speedY = (Math.random() - 0.5) * config.speed;
        this.opacity = 0.3 + Math.random() * 0.4;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.01 + Math.random() * 0.02;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;

        // Rebondir sur les bords
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
      }

      draw(ctx) {
        const pulseFactor = 0.5 + Math.sin(this.pulse) * 0.3;
        const currentSize = this.size * pulseFactor;
        const currentOpacity = this.opacity * pulseFactor;

        // Créer un gradient radial pour l'effet de brouillard
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentSize
        );

        // Centre plus opaque
        gradient.addColorStop(0, config.color.replace(/[\d.]+\)$/g, `${currentOpacity})`));
        // Bords très transparents pour un effet doux
        gradient.addColorStop(0.5, config.color.replace(/[\d.]+\)$/g, `${currentOpacity * 0.5})`));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialiser les particules
    particlesRef.current = [];
    for (let i = 0; i < config.particleCount; i++) {
      particlesRef.current.push(new Particle());
    }

    // Boucle d'animation
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Nettoyage
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    />
  );
};

export default ParticleBackground;
