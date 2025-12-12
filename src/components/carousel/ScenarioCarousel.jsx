import React, { useState, useRef, useEffect } from 'react';
import { Star, Clock, Download, ShoppingCart } from 'lucide-react';
import './ScenarioCarousel.css';

const ScenarioCarousel = ({ 
  scenarios,
  saga,
  onDownloadFree,
  onAddToCart,
  onScenarioClick,
  theme
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const carouselRef = useRef(null);
  const trackRef = useRef(null);

  // Parallax à la souris
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!carouselRef.current || isDragging) return;
      
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
  }, [isDragging]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(scenarios.length - 1, prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.scenario-button')) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const x = e.pageX;
    const offset = startX - x;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Si le drag est suffisant, changer de slide
    if (Math.abs(dragOffset) > 80) {
      if (dragOffset > 0 && currentIndex < scenarios.length - 1) {
        goToNext();
      } else if (dragOffset < 0 && currentIndex > 0) {
        goToPrevious();
      }
    }
    
    setDragOffset(0);
  };

  const handleCardClick = (scenario, index) => {
    if (!isDragging && Math.abs(dragOffset) < 10) {
      if (index === currentIndex) {
        onScenarioClick(scenario);
      } else {
        setCurrentIndex(index);
      }
    }
  };

  // Déterminer les couleurs du thème
  const getThemeColors = () => {
    if (theme?.id === 'medieval') {
      return {
        primary: '#d97706',
        secondary: '#92400e',
        text: '#fef3c7'
      };
    } else if (theme?.id === 'lovecraft') {
      return {
        primary: '#10b981',
        secondary: '#065f46',
        text: '#d1fae5'
      };
    } else if (theme?.id === 'scifi') {
      return {
        primary: '#06b6d4',
        secondary: '#164e63',
        text: '#cffafe'
      };
    }
    return {
      primary: '#d97706',
      secondary: '#92400e',
      text: '#fef3c7'
    };
  };

  const colors = getThemeColors();

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="scenario-carousel-empty">
        <p>Aucun scénario disponible</p>
      </div>
    );
  }

  return (
    <div 
      ref={carouselRef}
      className="scenario-carousel centered"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        '--theme-primary': colors.primary,
        '--theme-secondary': colors.secondary,
        '--theme-text': colors.text
      }}
    >
      <div 
        ref={trackRef}
        className="scenario-carousel-track centered"
        style={{
          transform: `translateX(calc(50% - ${currentIndex * 520}px - 260px - ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {scenarios.map((scenario, index) => {
          const distance = Math.abs(currentIndex - index);
          const isActive = currentIndex === index;
          const scale = isActive ? 1 : 0.85;
          const opacity = distance > 1 ? 0.3 : (isActive ? 1 : 0.6);
          
          return (
            <div 
              key={scenario.id}
              className={`scenario-slide centered ${isActive ? 'active' : ''}`}
              onClick={() => handleCardClick(scenario, index)}
              style={{ 
                cursor: 'pointer',
                transform: `scale(${scale})`,
                opacity: opacity,
                transition: isDragging ? 'none' : 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: isActive ? 10 : 5 - distance
              }}
            >
              {/* Image avec parallax */}
              <div 
                className="scenario-image-container"
                style={{
                  transform: isActive ? `
                    translate(
                      ${mousePosition.x * 0.3 * 20}px,
                      ${mousePosition.y * 0.3 * 20}px
                    )
                    scale(1.1)
                  ` : 'scale(1.1)'
                }}
              >
                <img 
                  src={scenario.imageUrl}
                  alt={scenario.displayName}
                  className="scenario-image"
                  draggable="false"
                />
              </div>

              {/* Overlay */}
              <div className="scenario-overlay"></div>

              {/* Badge numéro */}
              <div className="scenario-number">#{index + 1}</div>

              {/* Badge gratuit */}
              {scenario.isFree && (
                <div className="scenario-free-badge">GRATUIT</div>
              )}

              {/* Contenu */}
              <div className="scenario-content">
                <h2 className="scenario-title">{scenario.displayName}</h2>
                
                <div className="scenario-meta">
                  <div className="scenario-author">✍️ {scenario.author}</div>
                  <div className="scenario-duration">
                    <Clock size={16} /> {scenario.duration}
                  </div>
                </div>

                <p className="scenario-description">{scenario.description}</p>

                {/* Tags */}
                <div className="scenario-tags">
                  {scenario.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="scenario-tag">{tag}</span>
                  ))}
                </div>

                {/* Notations */}
                <div className="scenario-ratings">
                  <div className="rating-item">
                    <span className="rating-icon">🌙</span>
                    <div className="rating-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star 
                          key={s} 
                          size={14} 
                          className={s <= scenario.ratings.ambiance ? 'star-filled' : 'star-empty'}
                          fill={s <= scenario.ratings.ambiance ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rating-item">
                    <span className="rating-icon">🧩</span>
                    <div className="rating-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star 
                          key={s} 
                          size={14} 
                          className={s <= scenario.ratings.complexite ? 'star-filled' : 'star-empty'}
                          fill={s <= scenario.ratings.complexite ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rating-item">
                    <span className="rating-icon">⚔️</span>
                    <div className="rating-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star 
                          key={s} 
                          size={14} 
                          className={s <= scenario.ratings.combat ? 'star-filled' : 'star-empty'}
                          fill={s <= scenario.ratings.combat ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rating-item">
                    <span className="rating-icon">🔍</span>
                    <div className="rating-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star 
                          key={s} 
                          size={14} 
                          className={s <= scenario.ratings.enquete ? 'star-filled' : 'star-empty'}
                          fill={s <= scenario.ratings.enquete ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="scenario-actions">
                  {scenario.isFree ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadFree(scenario.pdfUrl, scenario.displayName);
                      }}
                      className="scenario-button download"
                    >
                      <Download size={18} />
                      Télécharger
                    </button>
                  ) : (
                    <>
                      <div className="scenario-price">{scenario.price.toFixed(2)} €</div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart({ type: 'scenario', item: scenario, saga });
                        }}
                        className="scenario-button cart"
                      >
                        <ShoppingCart size={18} />
                        Ajouter
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      {scenarios.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button 
              className="carousel-nav prev"
              onClick={goToPrevious}
              aria-label="Scénario précédent"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {currentIndex < scenarios.length - 1 && (
            <button 
              className="carousel-nav next"
              onClick={goToNext}
              aria-label="Scénario suivant"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Indicateurs */}
          <div className="carousel-indicators">
            {scenarios.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Aller au scénario ${index + 1}`}
              />
            ))}
          </div>

          {/* Compteur */}
          <div className="carousel-counter">
            <span className="current">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="separator">/</span>
            <span className="total">{String(scenarios.length).padStart(2, '0')}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ScenarioCarousel;
