# 🔒 Audit de Sécurité - Le Codex JDR

**Date :** 8 décembre 2025  
**Auditeur :** Assistant IA  
**Portée :** Application web complète + infrastructure Supabase

---

## 📊 Score Global de Sécurité : 7/10

**Statut :** 🟡 **BON** avec améliorations nécessaires avant production

---

## ✅ Points Forts Identifiés

### 1. Authentification Admin 🔐
**Score : 9/10 - Excellent**

✅ **Implémenté correctement :**
- Hash bcrypt (10 rounds) pour les mots de passe
- Fonction `hashPassword()` et `verifyPassword()` sécurisées
- Pas de mot de passe en clair dans le code
- Utilisation de `bcryptjs` côté client
- Script dédié `generatePasswordHash.js` pour créer les hash

✅ **Gestion des sessions :**
- Sessions avec expiration (24h)
- Timestamp de session vérifié
- Rafraîchissement automatique de session
- Nettoyage de session lors de l'expiration
- Vérification périodique (toutes les minutes)

✅ **Protection des routes :**
- Middleware `ProtectedRoute` fonctionnel
- Redirection vers `/login` si non authentifié
- État de connexion préservé pour redirection post-login

### 2. Variables d'Environnement 🌍
**Score : 8/10 - Très bien**

✅ **Bonnes pratiques :**
- Fichier `.env.example` propre et documenté
- Utilisation de `VITE_` pour les variables publiques
- Distinction claire entre clés publiques et privées
- Instructions claires pour Stripe (test/prod)

✅ **Secrets protégés :**
- `.env` dans `.gitignore`
- Pas de secrets committés dans le code
- Hash de mot de passe (pas de mot de passe en clair)

### 3. Row Level Security (RLS) Supabase 🛡️
**Score : 6/10 - Acceptable mais nécessite amélioration**

✅ **Déjà activé :**
- RLS activé sur toutes les tables principales
- Politiques de lecture publique correctement définies
- Séparation des permissions (lecture/écriture)

---

## 🚨 Vulnérabilités Identifiées

### 🔴 CRITIQUE - Priorité 1

#### 1. Upload de Fichiers - Sanitization Insuffisante
**Sévérité : ÉLEVÉE**

**Problème :**
```javascript
// Dans uploadImage() - supabaseService.js
const fileExt = file.name.split('.').pop().toLowerCase();
const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
```

❌ **Vulnérabilités :**
- Pas de sanitization du nom de fichier original
- Caractères spéciaux/espaces peuvent causer des erreurs
- Accents non gérés (exemple : "La Bête de Nectaire sur Houblon.png")
- Extension non validée (pourrait accepter `.exe`, `.sh`, etc.)

**Impact :**
- Erreurs d'upload (expérience utilisateur dégradée)
- Potentiel directory traversal si mal géré
- Fichiers malveillants si extension non validée

**Solution recommandée :**
```javascript
// Fonction de sanitization
const sanitizeFileName = (fileName) => {
  const parts = fileName.split('.');
  const extension = parts.pop().toLowerCase();
  const nameWithoutExt = parts.join('.');
  
  // Remplacer accents et caractères spéciaux
  const sanitized = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  return `${sanitized}.${extension}`;
};

// Validation stricte des extensions
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_PDF_EXTENSIONS = ['pdf'];

const uploadImage = async (file, folder = 'general') => {
  const fileExt = file.name.split('.').pop().toLowerCase();
  
  // Valider l'extension
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
    throw new Error(`Extension non autorisée. Formats acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`);
  }
  
  // Sanitizer le nom
  const sanitizedName = sanitizeFileName(file.name);
  const fileName = `${Date.now()}-${sanitizedName}`;
  const filePath = `${folder}/${fileName}`;
  
  // ... reste du code
};
```

#### 2. Clés Supabase Exposées Côté Client
**Sévérité : MOYENNE (Acceptable pour anon key, critique pour service role)**

**Problème actuel :**
```javascript
// .env.example
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

✅ **Acceptable :** La clé `anon` PEUT être exposée côté client (c'est son usage)
❌ **CRITIQUE si :** Vous utilisez la `service_role` key côté client

**Vérification nécessaire :**
```bash
# Dans votre .env, vérifiez que vous n'avez PAS :
VITE_SUPABASE_ANON_KEY=eyJh... # Commence par service_role ?
```

**Action :**
- ✅ Si vous utilisez `anon` key : OK, continuez
- ❌ Si vous utilisez `service_role` côté client : **CHANGEZ IMMÉDIATEMENT**

### 🟠 HAUTE - Priorité 2

#### 3. Validation des Entrées Utilisateur Insuffisante
**Sévérité : MOYENNE-ÉLEVÉE**

**Problèmes identifiés :**

```javascript
// Dans main.jsx - Formulaire de soumission
<input type="text" name="scenarioName" required />
```

❌ **Manque :**
- Pas de limite de longueur explicite
- Pas de sanitization des entrées avant insertion DB
- Pas de validation des formats email
- Pas d'échappement HTML (risque XSS)

**Risques :**
- **XSS (Cross-Site Scripting)** : Un utilisateur pourrait injecter du code JavaScript
- **Injection SQL** : Bien que Supabase protège, une défense en profondeur est nécessaire
- **DoS** : Entrées très longues pourraient causer des problèmes

**Solution recommandée :**
```javascript
// Créer src/utils/validation.js
export const sanitizeInput = (input, maxLength = 255) => {
  if (!input) return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, ''); // Enlever balises HTML basiques
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Utilisation dans les formulaires
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const scenarioName = sanitizeInput(e.target.scenarioName.value, 100);
  const author = sanitizeInput(e.target.author.value, 100);
  const email = e.target.email.value.trim();
  const summary = sanitizeInput(e.target.summary.value, 1000);
  
  if (!validateEmail(email)) {
    alert('Email invalide');
    return;
  }
  
  // ... reste du code
};
```

#### 4. Pas de Rate Limiting
**Sévérité : MOYENNE**

**Problème :**
- Aucune limite sur les tentatives de connexion
- Pas de throttling sur les uploads
- Risque de brute-force sur le mot de passe admin
- Risque de spam sur les soumissions

**Solution recommandée :**
```javascript
// src/utils/rateLimiter.js
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Nettoyer les anciennes tentatives
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key) {
    this.attempts.delete(key);
  }
}

// Utilisation dans LoginPage
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 tentatives / 15 min

const handleSubmit = async (e) => {
  e.preventDefault();
  
  const clientIP = 'user-session'; // Ou utiliser un identifiant unique
  
  if (!loginRateLimiter.isAllowed(clientIP)) {
    setError('Trop de tentatives. Veuillez réessayer dans 15 minutes.');
    return;
  }
  
  // ... reste du code
};
```

### 🟡 MOYENNE - Priorité 3

#### 5. Logs Sensibles en Console
**Sévérité : BASSE-MOYENNE**

**Problème :**
```javascript
// Dans supabaseService.js
console.log('updateTheme - cleanedUpdates:', cleanedUpdates);
console.error('Erreur upload:', error);
```

❌ **Risques :**
- Exposition d'informations sensibles dans les logs navigateur
- Facilite le reverse engineering
- Peut révéler la structure de la BDD

**Solution :**
```javascript
// Créer src/utils/logger.js
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDevelopment) console.log(...args);
  },
  error: (...args) => {
    console.error(...args); // Toujours logger les erreurs
  },
  warn: (...args) => {
    if (isDevelopment) console.warn(...args);
  }
};

// Utiliser partout
import { logger } from '../utils/logger';
logger.log('updateTheme - cleanedUpdates:', cleanedUpdates);
```

#### 6. Pas de HTTPS Forcé
**Sévérité : CRITIQUE en production**

**Vérification :**
- Assurez-vous que Vercel force HTTPS automatiquement
- Vérifiez les redirections HTTP → HTTPS

**Configuration recommandée (vercel.json) :**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

#### 7. LocalStorage pour l'Authentification
**Sévérité : BASSE-MOYENNE**

**Problème :**
```javascript
localStorage.setItem(AUTH_TOKEN_KEY, 'true');
```

⚠️ **Vulnérabilité :**
- LocalStorage accessible par JavaScript (vulnérable au XSS)
- Pas de protection HttpOnly comme les cookies

**Alternative plus sécurisée :**
- Utiliser Supabase Auth (sessions gérées côté serveur)
- Ou utiliser des cookies HttpOnly (nécessite un backend)

**Pour l'instant : ACCEPTABLE** si :
- ✅ Vous sanitisez toutes les entrées (prévention XSS)
- ✅ Vous avez des headers CSP (Content Security Policy)

---

## 📋 Plan d'Action Priorisé

### Phase 1 : Actions Immédiates (Avant Mise en Production)
**Deadline : Avant tout déploiement public**

- [ ] **1.1** Implémenter sanitization des noms de fichiers (upload images/PDFs)
- [ ] **1.2** Valider strictement les extensions de fichiers autorisées
- [ ] **1.3** Vérifier que vous utilisez `anon` key (pas `service_role`) côté client
- [ ] **1.4** Ajouter validation des entrées utilisateur (longueur, format, HTML)
- [ ] **1.5** Implémenter rate limiting sur la page de connexion
- [ ] **1.6** Configurer les headers de sécurité dans `vercel.json`
- [ ] **1.7** Retirer/conditionner les logs sensibles en console

### Phase 2 : Améliorations Court Terme (1-2 semaines)
**Deadline : Dans les 2 semaines du lancement**

- [ ] **2.1** Implémenter CSP (Content Security Policy) headers
- [ ] **2.2** Ajouter rate limiting sur les uploads et soumissions
- [ ] **2.3** Configurer des alertes de monitoring (Sentry, LogRocket)
- [ ] **2.4** Créer un système de backup automatique de la BDD
- [ ] **2.5** Documenter les procédures de réponse aux incidents
- [ ] **2.6** Tester le site avec OWASP ZAP ou Burp Suite

### Phase 3 : Améliorations Long Terme (1-3 mois)
**Deadline : 3 mois après le lancement**

- [ ] **3.1** Migrer vers Supabase Auth (remplacer localStorage)
- [ ] **3.2** Implémenter 2FA (authentification à deux facteurs)
- [ ] **3.3** Audit de sécurité externe par un professionnel
- [ ] **3.4** Mettre en place un WAF (Web Application Firewall)
- [ ] **3.5** Créer un bug bounty program
- [ ] **3.6** Obtenir une certification de sécurité (ISO 27001, SOC 2)

---

## 🛡️ Checklist de Sécurité Pré-Production

### Configuration Supabase
- [ ] RLS activé sur toutes les tables
- [ ] Politiques RLS testées et validées
- [ ] Bucket Storage configuré en privé (sauf images publiques)
- [ ] Service Role Key uniquement côté backend (jamais client)
- [ ] Backup automatique activé
- [ ] Logs d'audit activés

### Code et Déploiement
- [ ] Toutes les dépendances à jour (`npm audit` sans vulnérabilités critiques)
- [ ] `.env` dans `.gitignore`
- [ ] Variables d'environnement configurées sur Vercel
- [ ] HTTPS forcé (redirect automatique)
- [ ] Headers de sécurité configurés
- [ ] Error boundaries implémentés (pas d'erreurs exposées)

### Tests de Sécurité
- [ ] Test de tentatives de connexion multiples (rate limiting)
- [ ] Test d'upload de fichiers malveillants (validation extensions)
- [ ] Test d'injection XSS dans les formulaires
- [ ] Test d'accès aux routes admin sans authentification
- [ ] Test de session expirée (redirection login)
- [ ] Test de modification de données sans autorisation

### Monitoring et Réponse
- [ ] Outil de monitoring configuré (Sentry, etc.)
- [ ] Alertes configurées pour les erreurs critiques
- [ ] Plan de réponse aux incidents documenté
- [ ] Contact de sécurité publié (security@domain.com)
- [ ] Procédure de rotation des clés documentée

---

## 📈 Recommandations Générales

### 1. Culture de Sécurité
- 🎓 Former l'équipe aux bonnes pratiques OWASP Top 10
- 📚 Maintenir une documentation de sécurité à jour
- 🔄 Réviser le code avec une checklist de sécurité
- 🐛 Encourager le signalement de bugs de sécurité

### 2. Principe du Moindre Privilège
- ✅ Limiter les accès aux données strictement nécessaires
- ✅ Séparer les environnements (dev/staging/prod)
- ✅ Utiliser des comptes séparés pour chaque service
- ✅ Révoquer régulièrement les accès inutilisés

### 3. Défense en Profondeur
- 🛡️ Plusieurs couches de sécurité (client + serveur + BDD)
- 🔍 Validation côté client ET serveur
- 📊 Logging et monitoring à tous les niveaux
- 🚨 Alertes automatiques sur comportements suspects

### 4. Mises à Jour Régulières
- 🔄 Mettre à jour les dépendances mensuellement
- 📅 Calendrier de revue de sécurité trimestrielle
- 🐛 Suivre les CVE des bibliothèques utilisées
- ✅ Tester après chaque mise à jour majeure

---

## 🎯 Score Détaillé par Catégorie

| Catégorie | Score | Commentaire |
|-----------|-------|-------------|
| **Authentification** | 9/10 | ✅ Excellent (bcrypt, sessions) |
| **Autorisation** | 6/10 | ⚠️ RLS OK, mais peut être amélioré |
| **Validation Entrées** | 5/10 | ⚠️ Basique, nécessite amélioration |
| **Gestion Secrets** | 8/10 | ✅ Bien (env vars, pas de secrets en clair) |
| **Upload Fichiers** | 4/10 | 🚨 Vulnérable, sanitization manquante |
| **Protection XSS** | 5/10 | ⚠️ Basique, nécessite sanitization HTML |
| **Protection CSRF** | 7/10 | ✅ Supabase gère, mais pourrait être renforcé |
| **Rate Limiting** | 2/10 | 🚨 Absent, implémentation nécessaire |
| **Logging/Monitoring** | 4/10 | ⚠️ Basique, logs pas sécurisés |
| **Infrastructure** | 7/10 | ✅ Bien (Supabase + Vercel) |

---

## 📝 Conclusion

Votre application **Le Codex JDR** présente une **base de sécurité solide**, notamment au niveau de l'authentification et de la gestion des secrets. Cependant, plusieurs **vulnérabilités critiques** doivent être corrigées avant la mise en production publique.

### Points Positifs 👍
- ✅ Authentification robuste avec bcrypt
- ✅ Protection des routes admin fonctionnelle
- ✅ Pas de secrets exposés dans le code
- ✅ RLS Supabase activé
- ✅ Hébergement sécurisé (Vercel + Supabase)

### Points d'Attention 🚨
- 🔴 Upload de fichiers non sécurisé
- 🟠 Validation des entrées insuffisante
- 🟠 Absence de rate limiting
- 🟡 Logs sensibles en production

### Verdict Final
**⚠️ NON PRÊT pour la production sans corrections**

**Estimation du travail nécessaire :**
- Phase 1 (critique) : **4-8 heures de développement**
- Phase 2 (important) : **2-3 jours**
- Phase 3 (optionnel) : **1-2 semaines**

**Recommandation :** Implémentez au minimum la **Phase 1** avant tout lancement public. Les Phases 2 et 3 peuvent être ajoutées progressivement.

---

## 📞 Contact et Support

Pour toute question sur cet audit ou pour une assistance à l'implémentation :
- 📧 Consultez la documentation OWASP : https://owasp.org/www-project-top-ten/
- 🔒 Guide de sécurité Supabase : https://supabase.com/docs/guides/platform/security
- 🛡️ Vercel Security : https://vercel.com/docs/security

---

**Audit réalisé le :** 8 décembre 2025  
**Version du code :** commit `bf34eda6ed72ca0a81879279567f0eb9df439c7e`  
**Prochain audit recommandé :** Dans 3 mois ou après modifications majeures
