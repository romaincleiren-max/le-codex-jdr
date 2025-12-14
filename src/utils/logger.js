// ============================================================================
// LOGGER - Gestion sécurisée des logs
// Affiche les logs uniquement en développement pour éviter l'exposition d'informations
// ============================================================================

/**
 * Vérifie si on est en mode développement
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Logger sécurisé qui n'affiche les logs qu'en développement
 * En production, seules les erreurs sont loggées
 */
export const logger = {
  /**
   * Log normal - Affiché uniquement en développement
   * @param  {...any} args - Arguments à logger
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log d'erreur - Toujours affiché (même en production)
   * @param  {...any} args - Arguments à logger
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log d'avertissement - Affiché uniquement en développement
   * @param  {...any} args - Arguments à logger
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log d'information - Affiché uniquement en développement
   * @param  {...any} args - Arguments à logger
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log de débogage - Affiché uniquement en développement
   * @param  {...any} args - Arguments à logger
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;
