// ============================================================================
// RATE LIMITER - Protection contre brute-force et spam
// Limite le nombre de tentatives par fenêtre de temps
// ============================================================================

/**
 * Classe RateLimiter pour limiter les tentatives d'actions
 * Utilise le localStorage pour persister entre les rechargements de page
 */
class RateLimiter {
  constructor(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.key = `rate_limit_${key}`;
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Récupère les tentatives depuis le localStorage
   * @returns {number[]} - Array de timestamps
   */
  getAttempts() {
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sauvegarde les tentatives dans le localStorage
   * @param {number[]} attempts - Array de timestamps
   */
  saveAttempts(attempts) {
    try {
      localStorage.setItem(this.key, JSON.stringify(attempts));
    } catch (error) {
      console.error('Erreur sauvegarde rate limiter:', error);
    }
  }

  /**
   * Vérifie si une action est autorisée
   * @returns {{allowed: boolean, remaining: number, resetIn: number}} - Résultat
   */
  check() {
    const now = Date.now();
    let attempts = this.getAttempts();

    // Nettoyer les tentatives hors fenêtre
    attempts = attempts.filter(timestamp => now - timestamp < this.windowMs);

    const remaining = Math.max(0, this.maxAttempts - attempts.length);
    const allowed = attempts.length < this.maxAttempts;

    // Calculer le temps avant reset
    const oldestAttempt = attempts[0] || now;
    const resetIn = Math.max(0, this.windowMs - (now - oldestAttempt));

    return {
      allowed,
      remaining,
      resetIn,
      attempts: attempts.length
    };
  }

  /**
   * Enregistre une tentative
   * @returns {{allowed: boolean, remaining: number, resetIn: number}} - Résultat
   */
  attempt() {
    const result = this.check();
    
    if (result.allowed) {
      const now = Date.now();
      let attempts = this.getAttempts();
      
      // Nettoyer et ajouter la nouvelle tentative
      attempts = attempts.filter(timestamp => now - timestamp < this.windowMs);
      attempts.push(now);
      
      this.saveAttempts(attempts);
      
      return {
        ...result,
        remaining: Math.max(0, result.remaining - 1)
      };
    }
    
    return result;
  }

  /**
   * Réinitialise le compteur
   */
  reset() {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error('Erreur reset rate limiter:', error);
    }
  }

  /**
   * Formate le temps restant en texte lisible
   * @param {number} ms - Millisecondes
   * @returns {string} - Temps formaté
   */
  static formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }
}

// ============================================================================
// INSTANCES PRÉ-CONFIGURÉES
// ============================================================================

/**
 * Rate limiter pour les tentatives de connexion
 * 5 tentatives maximum toutes les 15 minutes
 */
export const loginRateLimiter = new RateLimiter('login', 5, 15 * 60 * 1000);

/**
 * Rate limiter pour les soumissions de scénarios
 * 3 soumissions maximum par heure
 */
export const submissionRateLimiter = new RateLimiter('submission', 3, 60 * 60 * 1000);

/**
 * Rate limiter pour les uploads d'images
 * 10 uploads maximum par minute
 */
export const uploadRateLimiter = new RateLimiter('upload', 10, 60 * 1000);

/**
 * Rate limiter pour les demandes de téléchargement gratuit
 * 5 téléchargements maximum par heure
 */
export const downloadRateLimiter = new RateLimiter('download', 5, 60 * 60 * 1000);

// Export de la classe pour créer des limiteurs personnalisés
export default RateLimiter;
