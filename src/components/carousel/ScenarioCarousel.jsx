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
  const [currentIndex, setCurrentIndex] = useState(scenarios.length);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const slideWidth = 450 + 32; // 450px + gap
  
  // Créer un tableau infini avec des clones (avant, milieu, après)
  const extendedScenarios = [
    ...scenarios,
    ...scenarios,
    ...scenarios
  ];

  // Réinitialiser position sans animation quand on atteint les extrêmes
  useEffect(() => {
    if (currentIndex <= 0) {
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          setCurrentIndex(scenarios.length);
          requestAnimationFrame(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = '';
            }
          });
        }
      }, 300);
    } else if (currentIndex >= scenarios.length * 2) {
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          setCurrentIndex(scenarios.length);
          requestAnimationFrame(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = '';
            }
          });
        }
      }, 300);
    }
  }, [currentIndex, scenarios.length]);

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
    setCurrentIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(scenarios.length + index);
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
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    setDragOffset(0);
  };

  const handleCardClick = (scenario) => {
    if (!isDragging && Math.abs(dragOffset) < 10) {
      onScenarioClick(scenario);
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
  const realIndex = ((currentIndex - scenarios.length) % scenarios.length + scenarios.length) % scenarios.length;

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
      className="scenario-carousel"
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
        className="scenario-carousel-track"
        style={{
          transform: `translateX(-${currentIndex * slideWidth + dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {extendedScenarios.map((scenario, index) => {
          const originalIndex = index % scenarios.length;
          return (
            <div 
              key={`${scenario.id}-${index}`}
              className="scenario-slide"
              onClick={() => handleCardClick(scenario)}
              style={{ cursor: 'pointer' }}
            >
              {/* Image avec parallax */}
              <div 
                className="scenario-image-container"
                style={{
                  transform: `
                    translate(
                      ${mousePosition.x * 0.3 * 20}px,
                      ${mousePosition.y * 0.3 * 20}px
                    )
                    scale(1.1)
                  `
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
              <div className="scenario-number">#{originalIndex + 1}</div>

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
          <button 
            className="carousel-nav prev"
            onClick={goToPrevious}
            aria-label="Scénario précédent"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button 
            className="carousel-nav next"
            onClick={goToNext}
            aria-label="Scénario suivant"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Indicateurs */}
          <div className="carousel-indicators">
            {scenarios.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === realIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Aller au scénario ${index + 1}`}
              />
            ))}
          </div>

          {/* Compteur */}
          <div className="carousel-counter">
            <span className="current">{String(realIndex + 1).padStart(2, '0')}</span>
            <span className="separator">/</span>
            <span className="total">{String(scenarios.length).padStart(2, '0')}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ScenarioCarousel;
