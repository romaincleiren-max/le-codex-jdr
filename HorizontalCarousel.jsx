import { useState, useRef, useEffect } from 'react';
import './HorizontalCarousel.css';

const HorizontalCarousel = ({ 
  slides,
  autoPlay = false,
  interval = 5000,
  parallaxIntensity = 0.3
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const carouselRef = useRef(null);
  const slideWidth = 100; // Pourcentage

  // Auto-play
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      goToNext();
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, autoPlay, interval]);

  // Parallax à la souris
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!carouselRef.current) return;
      
      const rect = carouselRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      
      setMousePosition({ x, y });
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (carousel) {
        carousel.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === slides.length - 1 ? 0 : prev + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Drag to scroll
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeft(currentIndex * slideWidth);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const x = e.pageX;
    const walk = (startX - x) / 5;
    
    if (Math.abs(walk) > 10) {
      if (walk > 0 && currentIndex < slides.length - 1) {
        goToNext();
        setIsDragging(false);
      } else if (walk < 0 && currentIndex > 0) {
        goToPrevious();
        setIsDragging(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={carouselRef}
      className="horizontal-carousel"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Slides Container */}
      <div 
        className="carousel-track"
        style={{
          transform: `translateX(-${currentIndex * slideWidth}%)`
        }}
      >
        {slides.map((slide, index) => (
          <div 
            key={index}
            className="carousel-slide"
          >
            {/* Image avec effet parallax */}
            <div 
              className="slide-image-container"
              style={{
                transform: `
                  translate(
                    ${mousePosition.x * parallaxIntensity * 20}px,
                    ${mousePosition.y * parallaxIntensity * 20}px
                  )
                  scale(1.1)
                `
              }}
            >
              <img 
                src={slide.image}
                alt={slide.title}
                className="slide-image"
                draggable="false"
              />
            </div>

            {/* Overlay avec dégradé */}
            <div className="slide-overlay"></div>

            {/* Contenu de la slide */}
            <div className="slide-content">
              <h2 className="slide-title">{slide.title}</h2>
              {slide.subtitle && (
                <p className="slide-subtitle">{slide.subtitle}</p>
              )}
              {slide.description && (
                <p className="slide-description">{slide.description}</p>
              )}
              {slide.button && (
                <button 
                  className="slide-button"
                  onClick={slide.button.onClick}
                >
                  {slide.button.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Boutons de navigation */}
      <button 
        className="carousel-nav prev"
        onClick={goToPrevious}
        aria-label="Slide précédente"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button 
        className="carousel-nav next"
        onClick={goToNext}
        aria-label="Slide suivante"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Indicateurs */}
      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Aller à la slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Compteur */}
      <div className="carousel-counter">
        <span className="current">{String(currentIndex + 1).padStart(2, '0')}</span>
        <span className="separator">/</span>
        <span className="total">{String(slides.length).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

export default HorizontalCarousel;
