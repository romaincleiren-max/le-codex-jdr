import HorizontalCarousel from './HorizontalCarousel';
import './CarouselExample.css';

function CarouselExample() {
  // Données des slides - À personnaliser
  const slides = [
    {
      image: '/images/scenario1.jpg',
      title: 'Les Chroniques du Codex',
      subtitle: 'Chapitre I : L\'Éveil',
      description: 'Plongez dans une aventure épique où magie et mystère se rencontrent. Votre destin vous attend.',
      button: {
        label: 'Découvrir',
        onClick: () => console.log('Slide 1 clicked')
      }
    },
    {
      image: '/images/scenario2.jpg',
      title: 'La Quête du Dragon',
      subtitle: 'Un périple légendaire',
      description: 'Affrontez des créatures mythiques et dévoilez les secrets d\'un royaume oublié.',
      button: {
        label: 'En savoir plus',
        onClick: () => console.log('Slide 2 clicked')
      }
    },
    {
      image: '/images/scenario3.jpg',
      title: 'L\'Empire des Ombres',
      subtitle: 'La bataille finale',
      description: 'Le destin du royaume repose entre vos mains. Êtes-vous prêt à relever le défi ?',
      button: {
        label: 'Commencer',
        onClick: () => console.log('Slide 3 clicked')
      }
    },
    {
      image: '/images/scenario4.jpg',
      title: 'Les Gardiens du Temps',
      subtitle: 'Une course contre la montre',
      description: 'Voyagez à travers les époques pour restaurer l\'équilibre du monde.',
      button: {
        label: 'Explorer',
        onClick: () => console.log('Slide 4 clicked')
      }
    }
  ];

  return (
    <div className="carousel-page">
      {/* Carousel Horizontal avec Parallax */}
      <HorizontalCarousel 
        slides={slides}
        autoPlay={false}
        interval={5000}
        parallaxIntensity={0.3}
      />

      {/* Instructions (optionnel) */}
      <div className="carousel-instructions">
        <p>
          <span className="instruction-icon">←</span>
          Utilisez les flèches ou glissez pour naviguer
          <span className="instruction-icon">→</span>
        </p>
        <p>Bougez votre souris pour l'effet parallax</p>
      </div>
    </div>
  );
}

export default CarouselExample;
