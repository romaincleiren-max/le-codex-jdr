import bcrypt from 'bcryptjs';

/**
 * Utilitaire de sécurité pour l'authentification
 * Utilise bcrypt pour le hachage sécurisé des mots de passe
 */

// Configuration de sécurité
const AUTH_TOKEN_KEY = 'le-codex-admin-auth';
const AUTH_TIMESTAMP_KEY = 'le-codex-admin-auth-timestamp';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

/**
 * Génère un hash bcrypt d'un mot de passe
 * Utilise 10 rounds de salage pour la sécurité
 * @param {string} password - Le mot de passe en clair
 * @returns {Promise<string>} Le hash bcrypt
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Vérifie si un mot de passe correspond au hash stocké
 * @param {string} password - Le mot de passe en clair à vérifier
 * @param {string} hash - Le hash bcrypt à comparer
 * @returns {Promise<boolean>} True si le mot de passe correspond
 */
export const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Erreur de vérification du mot de passe:', error);
    return false;
  }
};

/**
 * Authentifie un utilisateur avec le mot de passe admin
 * @param {string} password - Le mot de passe saisi par l'utilisateur
 * @returns {Promise<boolean>} True si l'authentification réussit
 */
export const authenticateUser = async (password) => {
  try {
    // Récupère le hash du mot de passe depuis les variables d'environnement
    const passwordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
    
    if (!passwordHash) {
      console.error('VITE_ADMIN_PASSWORD_HASH non défini dans les variables d\'environnement');
      return false;
    }

    // Vérifie le mot de passe contre le hash
    const isValid = await verifyPassword(password, passwordHash);
    
    if (isValid) {
      // Enregistre l'authentification avec un timestamp
      setAuthSession();
    }
    
    return isValid;
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return false;
  }
};

/**
 * Définit une session d'authentification avec timestamp
 */
export const setAuthSession = () => {
  const timestamp = Date.now();
  localStorage.setItem(AUTH_TOKEN_KEY, 'true');
  localStorage.setItem(AUTH_TIMESTAMP_KEY, timestamp.toString());
};

/**
 * Vérifie si l'utilisateur est authentifié et si la session est valide
 * @returns {boolean} True si l'utilisateur est authentifié et la session est valide
 */
export const isAuthenticated = () => {
  const isAuth = localStorage.getItem(AUTH_TOKEN_KEY) === 'true';
  const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
  
  if (!isAuth || !timestamp) {
    return false;
  }
  
  // Vérifie si la session n'a pas expiré
  const now = Date.now();
  const sessionAge = now - parseInt(timestamp, 10);
  
  if (sessionAge > SESSION_DURATION) {
    // Session expirée, nettoyer
    clearAuthSession();
    return false;
  }
  
  return true;
};

/**
 * Efface la session d'authentification
 */
export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TIMESTAMP_KEY);
};

/**
 * Obtient le temps restant de la session en millisecondes
 * @returns {number} Temps restant en ms, ou 0 si pas de session
 */
export const getSessionTimeRemaining = () => {
  const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
  
  if (!timestamp) {
    return 0;
  }
  
  const now = Date.now();
  const sessionAge = now - parseInt(timestamp, 10);
  const remaining = SESSION_DURATION - sessionAge;
  
  return remaining > 0 ? remaining : 0;
};

/**
 * Prolonge la session en mettant à jour le timestamp
 */
export const refreshSession = () => {
  if (isAuthenticated()) {
    setAuthSession();
  }
};
