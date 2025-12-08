# 🔐 Sécurité et Authentification - Le Codex JDR

## Résumé des Améliorations de Sécurité

Ce document décrit le système d'authentification renforcé mis en place pour protéger l'accès administrateur de l'application.

### ✅ Améliorations Implémentées

1. **Hash Bcrypt** - Les mots de passe ne sont plus stockés en clair
2. **Middleware d'Authentification** - Protection des routes avec vérification de session
3. **Expiration de Session** - Sessions limitées à 24 heures
4. **Gestion Sécurisée des Tokens** - Timestamp et validation automatique

---

## 🏗️ Architecture de Sécurité

### 1. Utilitaire d'Authentification (`src/utils/authUtils.js`)

Le module `authUtils.js` fournit toutes les fonctions nécessaires pour l'authentification sécurisée :

#### Fonctions Principales

- **`hashPassword(password)`** - Génère un hash bcrypt d'un mot de passe
- **`verifyPassword(password, hash)`** - Vérifie un mot de passe contre un hash
- **`authenticateUser(password)`** - Authentifie un utilisateur avec le système complet
- **`isAuthenticated()`** - Vérifie si l'utilisateur est authentifié et la session valide
- **`setAuthSession()`** - Crée une nouvelle session avec timestamp
- **`clearAuthSession()`** - Efface la session d'authentification
- **`refreshSession()`** - Prolonge la durée de la session active

#### Configuration de Sécurité

```javascript
const AUTH_TOKEN_KEY = 'le-codex-admin-auth';
const AUTH_TIMESTAMP_KEY = 'le-codex-admin-auth-timestamp';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures
```

---

### 2. Middleware de Protection (`src/components/ProtectedRoute.jsx`)

Le composant `ProtectedRoute` agit comme un middleware pour protéger les routes sensibles :

#### Fonctionnalités

- ✅ Vérifie l'authentification au chargement de chaque route
- ✅ Vérifie périodiquement l'expiration (toutes les 60 secondes)
- ✅ Rafraîchit automatiquement la session lors de la navigation
- ✅ Redirige vers `/login` si non authentifié
- ✅ Affiche un écran de chargement pendant la vérification

#### Utilisation

```jsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Route path="/admin" element={
  <ProtectedRoute>
    <AdminPage />
  </ProtectedRoute>
} />
```

---

### 3. Page de Connexion (`src/pages/LoginPage.jsx`)

La page de connexion a été mise à jour pour utiliser le système sécurisé :

#### Fonctionnalités

- ✅ Authentification asynchrone avec bcrypt
- ✅ États de chargement pendant la vérification
- ✅ Gestion d'erreurs améliorée
- ✅ Redirection vers la page d'origine après connexion
- ✅ Désactivation du bouton pendant le traitement

---

## 🔧 Configuration

### 1. Générer un Hash de Mot de Passe

Utilisez le script utilitaire pour générer un hash sécurisé :

```bash
# Mode interactif
node scripts/generatePasswordHash.js

# Avec argument
node scripts/generatePasswordHash.js "VotreMotDePasseSecurise"
```

Le script vous donnera une sortie comme :

```
VITE_ADMIN_PASSWORD_HASH=$2b$10$PDB2/eJQVMCG3mols6tF2uNt1XbE7BH.RPac65W2.i4b3GGn55h/.
```

### 2. Configuration de l'Environnement

#### Développement Local

Ajoutez le hash dans votre fichier `.env` :

```env
# Admin Authentication - Hash bcrypt du mot de passe admin
VITE_ADMIN_PASSWORD_HASH=$2b$10$PDB2/eJQVMCG3mols6tF2uNt1XbE7BH.RPac65W2.i4b3GGn55h/.
```

#### Production (Vercel)

1. Allez sur Vercel Dashboard
2. Sélectionnez votre projet
3. Settings > Environment Variables
4. Ajoutez la variable :
   - **Name:** `VITE_ADMIN_PASSWORD_HASH`
   - **Value:** Le hash généré
   - **Environment:** Production (ou tous)
5. Redéployez votre application

---

## 🔒 Sécurité du Système

### Bcrypt - Pourquoi ?

**Bcrypt** est un algorithme de hachage spécialement conçu pour les mots de passe :

1. **Salage Automatique** - Chaque hash est unique même pour le même mot de passe
2. **Coût Adaptatif** - Peut être ralenti pour résister aux attaques par force brute
3. **Résistant aux Rainbow Tables** - Impossible de pré-calculer les hash
4. **Sécurité Prouvée** - Standard de l'industrie depuis des décennies

### Cycle de Vie d'une Session

```
1. Utilisateur entre son mot de passe
   ↓
2. authenticateUser() vérifie avec bcrypt.compare()
   ↓
3. Si valide → setAuthSession() crée token + timestamp
   ↓
4. Navigation → ProtectedRoute vérifie isAuthenticated()
   ↓
5. Toutes les 60s → Vérification automatique de l'expiration
   ↓
6. Après 24h → Session expire → Redirection vers /login
```

### Niveaux de Protection

1. **Niveau 1** - Hash bcrypt (impossible à décrypter)
2. **Niveau 2** - Variable d'environnement (pas dans le code source)
3. **Niveau 3** - Session avec expiration (limitée dans le temps)
4. **Niveau 4** - Middleware de route (vérification à chaque navigation)
5. **Niveau 5** - Vérification périodique (déconnexion automatique)

---

## 📋 Bonnes Pratiques

### ✅ À FAIRE

- ✅ Utiliser un mot de passe fort (12+ caractères, majuscules, chiffres, symboles)
- ✅ Générer un nouveau hash pour chaque environnement
- ✅ Stocker le hash dans les variables d'environnement
- ✅ Ajouter `.env` dans `.gitignore`
- ✅ Changer le mot de passe régulièrement
- ✅ Utiliser HTTPS en production

### ❌ À NE PAS FAIRE

- ❌ Stocker le mot de passe en clair dans le code
- ❌ Commiter le fichier `.env` dans Git
- ❌ Partager le hash publiquement
- ❌ Utiliser le même mot de passe pour tous les environnements
- ❌ Utiliser des mots de passe faibles ou communs

---

## 🚨 Que Faire en Cas de Compromission ?

Si vous pensez que votre mot de passe a été compromis :

1. **Immédiatement**
   ```bash
   # Générez un nouveau hash
   node scripts/generatePasswordHash.js "NouveauMotDePasseEncorePlusSecurise"
   ```

2. **Mettez à jour `.env` localement**
   ```env
   VITE_ADMIN_PASSWORD_HASH=nouveau_hash_ici
   ```

3. **Mettez à jour sur Vercel**
   - Allez dans Settings > Environment Variables
   - Modifiez `VITE_ADMIN_PASSWORD_HASH`
   - Redéployez l'application

4. **Vérifiez les logs**
   - Consultez les logs Vercel pour des accès suspects
   - Vérifiez les timestamps d'authentification

---

## 🧪 Tests

### Tester le Système d'Authentification

1. **Test de connexion valide**
   - Utilisez le mot de passe correct
   - Vérifiez que vous êtes redirigé vers `/admin`
   - Vérifiez que `localStorage` contient les clés d'auth

2. **Test de connexion invalide**
   - Utilisez un mauvais mot de passe
   - Vérifiez le message d'erreur
   - Vérifiez que vous restez sur `/login`

3. **Test d'expiration de session**
   - Connectez-vous
   - Modifiez manuellement le timestamp dans localStorage (date passée)
   - Essayez d'accéder à une route protégée
   - Vérifiez que vous êtes redirigé vers `/login`

4. **Test de protection de routes**
   - Sans être connecté, essayez d'accéder à `/admin`
   - Vérifiez la redirection vers `/login`

---

## 📦 Dépendances

```json
{
  "bcryptjs": "^2.4.3"
}
```

Installation :
```bash
npm install bcryptjs
```

---

## 🔄 Migration depuis l'Ancien Système

L'ancien système stockait le mot de passe en clair dans `VITE_ADMIN_PASSWORD`.

### Étapes de Migration

1. ✅ Installé bcryptjs
2. ✅ Créé `src/utils/authUtils.js`
3. ✅ Mis à jour `src/components/ProtectedRoute.jsx`
4. ✅ Mis à jour `src/pages/LoginPage.jsx`
5. ✅ Créé `scripts/generatePasswordHash.js`
6. ✅ Généré un hash de mot de passe
7. ✅ Mis à jour `.env` et `.env.example`

### Nettoyage

Vous pouvez supprimer l'ancienne variable d'environnement :
```env
# À SUPPRIMER
VITE_ADMIN_PASSWORD=admin123
```

---

## 📞 Support

Pour toute question ou problème de sécurité :

1. Consultez cette documentation
2. Vérifiez les logs de la console
3. Testez le script `generatePasswordHash.js`
4. Vérifiez que `.env` est correctement configuré

---

## 📝 Changelog

### Version 2.0 - Décembre 2024
- ✅ Implémentation de bcrypt pour le hachage des mots de passe
- ✅ Middleware d'authentification avec expiration de session
- ✅ Script utilitaire de génération de hash
- ✅ Amélioration de la page de connexion
- ✅ Documentation complète de sécurité

### Version 1.0 - Initial
- ❌ Mot de passe en clair (DEPRECATED)
- ❌ Pas d'expiration de session (DEPRECATED)

---

## 🎯 Prochaines Améliorations Possibles

- [ ] Authentification à deux facteurs (2FA)
- [ ] Limitation des tentatives de connexion (rate limiting)
- [ ] Logs d'authentification détaillés
- [ ] Notification par email lors de connexions suspectes
- [ ] Support de multiples utilisateurs admin
- [ ] Récupération de mot de passe par email
- [ ] Intégration avec Supabase Auth

---

**🔐 Sécurité renforcée - Votre application est maintenant mieux protégée !**
