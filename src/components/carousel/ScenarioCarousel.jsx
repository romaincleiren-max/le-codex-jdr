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
  const [showCampaignScenarios, setShowCampaignScenarios] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const carouselRef = useRef(null);
  const trackRef = useRef(null);

  // Detecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    setCurrentIndex((prev) => Math.min(allItems.length - 1, prev + 1));
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
    
    // Système de snap intelligent - se raccroche au scénario le plus proche
    const cardWidth = 676; // 660px (largeur carte) + 16px (gap 1rem)
    const threshold = cardWidth * 0.25; // 25% de la largeur d'une carte (plus sensible)
    
    if (Math.abs(dragOffset) > threshold) {
      // Calculer combien de cartes on a "traversé"
      const cardsToMove = Math.round(dragOffset / cardWidth);
      const newIndex = currentIndex + cardsToMove;
      
      // S'assurer qu'on reste dans les limites (allItems.length sera défini plus tard)
      const maxIndex = scenarios.length; // campagne (0) + tous les scénarios
      const targetIndex = Math.max(0, Math.min(maxIndex, newIndex));
      setCurrentIndex(targetIndex);
    }
    // Sinon, on revient à la position actuelle (snap back)
    
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

  // Créer un tableau avec la carte campagne + les scénarios
  const allItems = [
    { type: 'campaign', data: saga },
    ...scenarios.map(s => ({ type: 'scenario', data: s }))
  ];

  const handleCampaignClick = () => {
    if (!isDragging && Math.abs(dragOffset) < 10) {
      if (currentIndex === 0) {
        setShowCampaignScenarios(!showCampaignScenarios);
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const handleScenarioLinkClick = (scenarioIndex) => {
    setShowCampaignScenarios(false);
    setCurrentIndex(scenarioIndex + 1); // +1 car la carte campagne est en position 0
  };

  // ========== VERSION MOBILE - Liste verticale scrollable ==========
  if (isMobile) {
    return (
      <div
        className="mobile-scenario-list"
        style={{
          '--theme-primary': colors.primary,
          '--theme-secondary': colors.secondary,
          '--theme-text': colors.text,
          padding: '1rem',
          paddingTop: '5rem',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        {/* Carte Campagne */}
        <div
          className="mobile-campaign-card"
          onClick={() => setShowCampaignScenarios(!showCampaignScenarios)}
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.95))',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: `2px solid ${colors.primary}`,
            position: 'relative'
          }}
        >
          {/* Image de fond */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${saga.backgroundImageUrl || scenarios[0]?.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(5px) brightness(0.3)',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem' }}>
            <div style={{
              display: 'inline-block',
              background: saga.isFree ? '#15803d' : colors.primary,
              color: 'white',
              padding: '0.3rem 0.8rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginBottom: '0.75rem'
            }}>
              📚 CAMPAGNE COMPLETE
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: '0.5rem'
            }}>{saga.name}</h2>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '0.75rem'
            }}>📖 {scenarios.length} scénarios</p>

            {saga.description && (
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
                marginBottom: '1rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>{saga.description}</p>
            )}

            {/* Liste des scénarios si déplié */}
            {showCampaignScenarios && (
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {scenarios.map((scenario, idx) => (
                  <button
                    key={scenario.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScenarioClick(scenario);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`,
                      border: `1px solid ${colors.primary}50`,
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    #{idx + 1} - {scenario.displayName}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {saga.isFree ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadFree(saga.pdfUrl, saga.name);
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Download size={18} /> Télécharger
                </button>
              ) : (
                <>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: colors.primary }}>
                    {saga.price.toFixed(2)} €
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart({ type: 'saga', item: saga });
                    }}
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShoppingCart size={18} /> Ajouter
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Liste des scénarios */}
        {scenarios.map((scenario, idx) => (
          <div
            key={scenario.id}
            onClick={() => onScenarioClick(scenario)}
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.9))',
              borderRadius: '1rem',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative'
            }}
          >
            {/* Image */}
            <div style={{
              position: 'relative',
              height: '180px',
              overflow: 'hidden'
            }}>
              <img
                src={scenario.imageUrl}
                alt={scenario.displayName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)'
              }} />

              {/* Badge numéro */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                background: colors.primary,
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>#{idx + 1}</div>

              {/* Badge gratuit */}
              {scenario.isFree && (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>GRATUIT</div>
              )}
            </div>

            {/* Contenu */}
            <div style={{ padding: '1rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '0.5rem'
              }}>{scenario.displayName}</h3>

              <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '0.75rem'
              }}>
                <span>✍️ {scenario.author}</span>
                <span>⏱️ {scenario.duration}</span>
              </div>

              {/* Ratings */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.7rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div>🌙</div>
                  <div style={{ color: '#fbbf24' }}>{'★'.repeat(scenario.ratings.ambiance)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div>🧩</div>
                  <div style={{ color: '#fbbf24' }}>{'★'.repeat(scenario.ratings.complexite)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div>⚔️</div>
                  <div style={{ color: '#fbbf24' }}>{'★'.repeat(scenario.ratings.combat)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div>🔍</div>
                  <div style={{ color: '#fbbf24' }}>{'★'.repeat(scenario.ratings.enquete)}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {scenario.isFree ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadFree(scenario.pdfUrl, scenario.displayName);
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <Download size={16} /> Télécharger
                  </button>
                ) : (
                  <>
                    <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: colors.primary }}>
                      {scenario.price.toFixed(2)} €
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart({ type: 'scenario', item: scenario, saga });
                      }}
                      style={{
                        flex: 1,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <ShoppingCart size={16} /> Ajouter
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ========== VERSION DESKTOP - Carousel horizontal ==========
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
          transform: `translateX(calc(50% - ${currentIndex * 676}px - 330px - ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {allItems.map((item, index) => {
          if (item.type === 'campaign') {
            // Carte "Campagne complète"
            const distance = Math.abs(currentIndex - index);
            const isActive = currentIndex === index;
            const scale = isActive ? 1.15 : 0.8;
            const opacity = distance > 1 ? 0.3 : (isActive ? 1 : 0.5);
            
            return (
              <div 
                key="campaign-card"
                className={`scenario-slide centered ${isActive ? 'active' : ''}`}
                onClick={handleCampaignClick}
                style={{ 
                  cursor: 'pointer',
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  transition: isDragging ? 'none' : 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: isActive ? 10 : 5 - distance
                }}
              >
                {/* Image de fond floue de la campagne */}
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
                  {saga.backgroundImageUrl || scenarios[0]?.imageUrl ? (
                    <img 
                      src={saga.backgroundImageUrl || scenarios[0]?.imageUrl}
                      alt={saga.name}
                      className="scenario-image"
                      draggable="false"
                      style={{ filter: 'blur(8px) brightness(0.5)' }}
                    />
                  ) : (
                    <div className="scenario-image" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)' }}></div>
                  )}
                </div>

                {/* Overlay plus sombre */}
                <div className="scenario-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7))' }}></div>

                {/* Badge "Pack" */}
                <div className="scenario-number" style={{ background: saga.isFree ? '#15803d' : '#d97706' }}>
                  📚 PACK
                </div>

                {/* Badge gratuit pour la campagne */}
                {saga.isFree && (
                  <div className="scenario-free-badge">GRATUIT</div>
                )}

                {/* Contenu */}
                <div className="scenario-content">
                  <h2 className="scenario-title" style={{
                    fontFamily: theme?.id === 'medieval' 
                      ? "'Cinzel', serif" :
                    theme?.id === 'lovecraft'
                      ? "'IM Fell English', serif" :
                    theme?.id === 'scifi'
                      ? "'Orbitron', sans-serif" :
                      "'Crimson Text', serif",
                    fontSize: '2rem'
                  }}>
                    📚 Campagne complète
                  </h2>
                  
                  <div className="scenario-meta" style={{ marginBottom: '1rem' }}>
                    <div className="scenario-author" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {saga.name}
                    </div>
                    <div className="scenario-duration">
                      📖 {scenarios.length} scénarios
                    </div>
                  </div>

                  {saga.description && (
                    <p className="scenario-description" style={{ marginBottom: '1.5rem' }}>
                      {saga.description}
                    </p>
                  )}

                  {/* Liste des scénarios (affichée si showCampaignScenarios) */}
                  {showCampaignScenarios && isActive && (
                    <div style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '0.5rem',
                      border: `2px solid ${colors.primary}`
                    }}>
                      <p style={{ 
                        color: colors.text, 
                        fontWeight: 'bold', 
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        Cliquez sur un scénario pour y accéder :
                      </p>
                      {scenarios.map((scenario, idx) => (
                        <button
                          key={scenario.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScenarioLinkClick(idx);
                          }}
                          className="scenario-button"
                          style={{
                            width: '100%',
                            marginBottom: '0.5rem',
                            padding: '0.75rem',
                            background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`,
                            border: `1px solid ${colors.primary}`,
                            justifyContent: 'flex-start',
                            fontSize: '0.875rem'
                          }}
                        >
                          #{idx + 1} - {scenario.displayName}
                        </button>
                      ))}
                    </div>
                  )}

                  {!showCampaignScenarios && isActive && (
                    <p style={{ 
                      color: colors.text, 
                      fontSize: '0.9rem', 
                      textAlign: 'center',
                      marginBottom: '1rem',
                      opacity: 0.8
                    }}>
                      👆 Cliquez pour voir les scénarios
                    </p>
                  )}

                  {/* Actions */}
                  <div className="scenario-actions">
                    {saga.isFree ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadFree(saga.pdfUrl, saga.name);
                        }}
                        className="scenario-button download"
                        style={{ width: '100%' }}
                      >
                        <Download size={18} />
                        Télécharger la campagne
                      </button>
                    ) : (
                      <>
                        <div className="scenario-price" style={{ fontSize: '1.5rem' }}>
                          {saga.price.toFixed(2)} €
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart({ type: 'saga', item: saga });
                          }}
                          className="scenario-button cart"
                        >
                          <ShoppingCart size={18} />
                          Ajouter
                        </button>
                      </>
                    )}
                  </div>
                  
                  {!saga.isFree && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: colors.primary, 
                      textAlign: 'center', 
                      marginTop: '0.5rem',
                      fontWeight: 'bold'
                    }}>
                      Économisez {((scenarios.filter(s => !s.isFree).reduce((sum, s) => sum + s.price, 0) - saga.price).toFixed(2))} €
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // Carte scénario normale
          const scenario = item.data;
          const scenarioIndex = index - 1; // -1 car la carte campagne est en position 0
          const distance = Math.abs(currentIndex - index);
          const isActive = currentIndex === index;
          const scale = isActive ? 1.15 : 0.8;
          const opacity = distance > 1 ? 0.3 : (isActive ? 1 : 0.5);
          
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
              <div className="scenario-number">#{scenarioIndex + 1}</div>

              {/* Badge gratuit */}
              {scenario.isFree && (
                <div className="scenario-free-badge">GRATUIT</div>
              )}

              {/* Contenu */}
              <div className="scenario-content">
                <h2 className="scenario-title" style={{
                  fontFamily: theme?.id === 'medieval' 
                    ? "'Cinzel', serif" :
                  theme?.id === 'lovecraft'
                    ? "'IM Fell English', serif" :
                  theme?.id === 'scifi'
                    ? "'Orbitron', sans-serif" :
                    "'Crimson Text', serif"
                }}>{scenario.displayName}</h2>
                
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
      {allItems.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button 
              className="carousel-nav prev"
              onClick={goToPrevious}
              aria-label="Élément précédent"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {currentIndex < allItems.length - 1 && (
            <button 
              className="carousel-nav next"
              onClick={goToNext}
              aria-label="Élément suivant"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Indicateurs */}
          <div className="carousel-indicators">
            {allItems.map((item, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={index === 0 ? 'Campagne complète' : `Scénario ${index}`}
              />
            ))}
          </div>

          {/* Compteur */}
          <div className="carousel-counter">
            <span className="current">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="separator">/</span>
            <span className="total">{String(allItems.length).padStart(2, '0')}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ScenarioCarousel;
