// ============================================================================
// UTILITAIRES DE VALIDATION ET SANITIZATION
// Protection contre XSS, injection SQL, et entrées malveillantes
// ============================================================================

/**
 * Sanitize une entrée texte en limitant la longueur et en enlevant les caractères dangereux
 * @param {string} input - L'entrée à nettoyer
 * @param {number} maxLength - Longueur maximale autorisée
 * @returns {string} - L'entrée nettoyée
 */
export const sanitizeInput = (input, maxLength = 255) => {
  if (!input) return '';
  
  return String(input)
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Enlever les balises HTML de base
};

/**
 * Sanitize du HTML en convertissant les caractères spéciaux
 * Prévient les attaques XSS en échappant les caractères HTML
 * @param {string} html - Le HTML à nettoyer
 * @returns {string} - Le HTML échappé
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Valide un email selon le format standard
 * @param {string} email - L'email à valider
 * @returns {boolean} - True si l'email est valide
 */
export const validateEmail = (email) => {
  if (!email) return false;
  
  // Regex standard pour validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide une URL
 * @param {string} url - L'URL à valider
 * @returns {boolean} - True si l'URL est valide
 */
export const validateURL = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Nettoie un nom de fichier en enlevant accents et caractères spéciaux
 * Compatible Supabase Storage
 * @param {string} fileName - Le nom de fichier à nettoyer
 * @returns {string} - Le nom de fichier nettoyé
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return 'unnamed';
  
  // Extraire le nom et l'extension
  const parts = fileName.split('.');
  const extension = parts.pop()?.toLowerCase() || '';
  const nameWithoutExt = parts.join('.');
  
  // Remplacer les accents et caractères spéciaux
  const sanitized = nameWithoutExt
    .normalize('NFD')                       // Décomposer les accents
    .replace(/[\u0300-\u036f]/g, '')       // Supprimer les diacritiques
    .toLowerCase()                          // Tout en minuscules
    .replace(/[^a-z0-9]+/g, '-')           // Remplacer non-alphanumériques par tiret
    .replace(/^-+|-+$/g, '')               // Enlever tirets début/fin
    .substring(0, 50);                      // Limiter la longueur
  
  // S'assurer qu'on a un nom valide
  const finalName = sanitized || 'file';
  
  return extension ? `${finalName}.${extension}` : finalName;
};

/**
 * Valide l'extension d'un fichier contre une liste blanche
 * @param {string} fileName - Le nom du fichier
 * @param {string[]} allowedExtensions - Extensions autorisées
 * @returns {boolean} - True si l'extension est autorisée
 */
export const validateFileExtension = (fileName, allowedExtensions) => {
  if (!fileName || !allowedExtensions || !allowedExtensions.length) {
    return false;
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension && allowedExtensions.includes(extension);
};

/**
 * Valide la taille d'un fichier
 * @param {number} fileSize - Taille du fichier en bytes
 * @param {number} maxSizeMB - Taille maximale en MB
 * @returns {boolean} - True si la taille est acceptable
 */
export const validateFileSize = (fileSize, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize > 0 && fileSize <= maxSizeBytes;
};

// Extensions autorisées par type de fichier
export const ALLOWED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  pdfs: ['pdf'],
  documents: ['pdf', 'doc', 'docx', 'txt'],
};

/**
 * Validation complète d'un fichier image
 * @param {File} file - Le fichier à valider
 * @returns {{valid: boolean, error: string}} - Résultat de validation
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' };
  }
  
  // Vérifier le type MIME
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Le fichier doit être une image' };
  }
  
  // Vérifier l'extension
  if (!validateFileExtension(file.name, ALLOWED_EXTENSIONS.images)) {
    return { 
      valid: false, 
      error: `Extension non autorisée. Formats acceptés : ${ALLOWED_EXTENSIONS.images.join(', ')}` 
    };
  }
  
  // Vérifier la taille (5MB max)
  if (!validateFileSize(file.size, 5)) {
    return { valid: false, error: 'L\'image ne doit pas dépasser 5MB' };
  }
  
  return { valid: true, error: null };
};

/**
 * Validation complète d'un fichier PDF
 * @param {File} file - Le fichier à valider
 * @returns {{valid: boolean, error: string}} - Résultat de validation
 */
export const validatePDFFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' };
  }
  
  // Vérifier le type MIME
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Le fichier doit être un PDF' };
  }
  
  // Vérifier l'extension
  if (!validateFileExtension(file.name, ALLOWED_EXTENSIONS.pdfs)) {
    return { valid: false, error: 'Seuls les fichiers PDF sont acceptés' };
  }
  
  // Vérifier la taille (10MB max pour PDF)
  if (!validateFileSize(file.size, 10)) {
    return { valid: false, error: 'Le PDF ne doit pas dépasser 10MB' };
  }
  
  return { valid: true, error: null };
};

/**
 * Nettoie et valide les données d'un formulaire de soumission
 * @param {Object} formData - Les données du formulaire
 * @returns {{valid: boolean, data: Object, errors: Object}} - Résultat
 */
export const validateSubmissionForm = (formData) => {
  const errors = {};
  const cleanData = {};
  
  // Validation et nettoyage du nom du scénario
  if (!formData.scenarioName || formData.scenarioName.trim().length === 0) {
    errors.scenarioName = 'Le nom du scénario est requis';
  } else if (formData.scenarioName.length > 100) {
    errors.scenarioName = 'Le nom ne doit pas dépasser 100 caractères';
  } else {
    cleanData.scenarioName = sanitizeInput(formData.scenarioName, 100);
  }
  
  // Validation et nettoyage de l'auteur
  if (!formData.author || formData.author.trim().length === 0) {
    errors.author = 'Le nom de l\'auteur est requis';
  } else if (formData.author.length > 100) {
    errors.author = 'Le nom de l\'auteur ne doit pas dépasser 100 caractères';
  } else {
    cleanData.author = sanitizeInput(formData.author, 100);
  }
  
  // Validation de l'email
  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = 'L\'email est requis';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'L\'email est invalide';
  } else {
    cleanData.email = formData.email.trim().toLowerCase();
  }
  
  // Validation et nettoyage du résumé
  if (!formData.summary || formData.summary.trim().length === 0) {
    errors.summary = 'Le résumé est requis';
  } else if (formData.summary.length < 50) {
    errors.summary = 'Le résumé doit contenir au moins 50 caractères';
  } else if (formData.summary.length > 2000) {
    errors.summary = 'Le résumé ne doit pas dépasser 2000 caractères';
  } else {
    cleanData.summary = sanitizeInput(formData.summary, 2000);
  }
  
  const valid = Object.keys(errors).length === 0;
  
  return { valid, data: cleanData, errors };
};
