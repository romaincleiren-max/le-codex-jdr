import { useState, useRef, useEffect } from 'react';
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const carouselRef = useRef(null);
  const slideWidth = 100;

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

  const goToPrevious = () => {
    setCurrentIndex((prev) => prev === 0 ? scenarios.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => prev === scenarios.length - 1 ? 0 : prev + 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const x = e.pageX;
    const walk = (startX - x) / 5;
    
    if (Math.abs(walk) > 10) {
      if (walk > 0 && currentIndex < scenarios.length - 1) {
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
        className="scenario-carousel-track"
        style={{
          transform: `translateX(-${currentIndex * slideWidth}%)`
        }}
      >
        {scenarios.map((scenario, index) => (
          <div 
            key={scenario.id}
            className="scenario-slide"
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onScenarioClick(scenario);
                  }}
                  className="scenario-button details"
                >
                  Détails →
                </button>
              </div>
            </div>
          </div>
        ))}
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
