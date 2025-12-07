# 🚀 Guide de Déploiement - Le Codex

Ce guide vous explique comment héberger votre site Le Codex gratuitement.

## ✅ Prérequis

Le site est maintenant prêt pour le déploiement ! Voici ce qui a été configuré :

- ✅ React Router configuré correctement
- ✅ Build testé et fonctionnel (`npm run build`)
- ✅ Configuration Vercel ajoutée (`vercel.json`)
- ✅ Configuration Netlify ajoutée (`public/_redirects`)
- ✅ `.gitignore` créé

## 🌐 Options d'Hébergement Gratuit

### Option 1 : Vercel (Recommandé) ⭐

**Avantages** : Déploiement automatique, certificat SSL gratuit, CDN mondial, domaine gratuit

**Étapes** :

1. **Créer un compte sur [Vercel](https://vercel.com)**
   - Inscrivez-vous avec GitHub, GitLab ou email

2. **Créer un dépôt Git** (si pas déjà fait)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Pousser sur GitHub/GitLab** (recommandé) ou importer directement

4. **Importer votre projet sur Vercel**
   - Cliquez sur "New Project"
   - Importez votre dépôt GitHub/GitLab
   - Vercel détectera automatiquement Vite
   - Cliquez sur "Deploy"

5. **C'est fait !** 🎉
   - Votre site sera accessible sur `https://votre-projet.vercel.app`
   - Chaque commit déclenchera un déploiement automatique

**Configuration automatique détectée** :
- Build Command : `npm run build`
- Output Directory : `dist`
- Install Command : `npm install`

---

### Option 2 : Netlify

**Avantages** : Très simple, formulaires intégrés, fonctions serverless

**Étapes** :

1. **Créer un compte sur [Netlify](https://netlify.com)**

2. **Glisser-déposer le dossier `dist`** (méthode rapide)
   - Exécutez `npm run build` localement
   - Glissez le dossier `dist` sur Netlify Drop

   **OU** Via Git (recommandé) :
   - Connectez votre dépôt GitHub/GitLab
   - Build command : `npm run build`
   - Publish directory : `dist`

3. **Votre site est en ligne !**
   - Accessible sur `https://votre-site.netlify.app`

---

### Option 3 : GitHub Pages

**Avantages** : Totalement gratuit, intégré à GitHub

**Étapes** :

1. **Installer gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Ajouter dans `package.json`**
   ```json
   "homepage": "https://votre-username.github.io/le-codex",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Déployer**
   ```bash
   npm run deploy
   ```

4. **Activer GitHub Pages**
   - Allez dans Settings > Pages
   - Source : `gh-pages` branch
   - Votre site sera sur `https://votre-username.github.io/le-codex`

---

### Option 4 : Render

**Avantages** : Gratuit, base de données incluse si besoin

**Étapes** :

1. **Créer un compte sur [Render](https://render.com)**

2. **Créer un "Static Site"**
   - Connectez votre dépôt GitHub
   - Build Command : `npm run build`
   - Publish Directory : `dist`

3. **Déployer**
   - Cliquez sur "Create Static Site"

---

## 📋 Commandes Utiles

```bash
# Développement local
npm run dev

# Build de production (génère le dossier dist/)
npm run build

# Prévisualiser le build localement
npm run preview
```

---

## 🔧 Configuration des Domaines Personnalisés

### Sur Vercel :
1. Allez dans Project Settings > Domains
2. Ajoutez votre domaine
3. Configurez les DNS chez votre registrar

### Sur Netlify :
1. Allez dans Site Settings > Domain Management
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions DNS

---

## ⚠️ Points Importants

### 1. **Données localStorage**
- ⚠️ Les données (campagnes, scénarios) sont stockées dans le **localStorage du navigateur**
- Chaque utilisateur a ses propres données locales
- Les données ne sont **pas synchronisées** entre appareils
- **Backup recommandé** : Exportez régulièrement vos données

### 2. **Images**
- Utilisez des URLs externes (Imgur recommandé)
- Ne mettez pas d'images lourdes directement dans le projet

### 3. **PDFs**
- Hébergez vos PDFs sur un service externe (Google Drive, Dropbox, etc.)
- Utilisez des liens directs dans l'admin

---

## 🎨 Personnalisation Post-Déploiement

Une fois déployé, accédez à votre site et :

1. **Page Admin** (`/admin`)
   - Mot de passe par défaut : `admin123`
   - Créez vos premières campagnes
   - Ajoutez des scénarios

2. **Personnalisez le site** (Admin > Paramètres)
   - Changez le nom du site
   - Ajoutez votre logo
   - Modifiez le slogan

3. **Configurez les thèmes** (Admin > Page Accueil)
   - Personnalisez les images de fond des sections

---

## 🆘 Support & Documentation

### Problèmes courants :

**"Page blanche après déploiement"**
- Vérifiez que `vercel.json` ou `_redirects` est présent
- React Router nécessite ces fichiers pour fonctionner

**"Les routes ne marchent pas"**
- C'est normal sur un hébergement sans configuration
- Utilisez Vercel ou Netlify qui gèrent cela automatiquement

**"Les images ne s'affichent pas"**
- Utilisez des URLs absolues (https://...)
- Pas de chemins relatifs pour les images externes

---

## 🎉 Félicitations !

Votre site Le Codex est maintenant prêt à être hébergé !

**Recommandation** : Utilisez **Vercel** pour le déploiement le plus simple et automatique.

---

## 📝 Checklist Avant Déploiement

- ✅ `npm run build` fonctionne sans erreur
- ✅ `npm run preview` affiche correctement le site
- ✅ Testez la navigation entre les pages
- ✅ Vérifiez que les images s'affichent
- ✅ Testez l'ajout de campagnes en mode admin
- ✅ Vérifiez le panier et le checkout

**Vous êtes prêt !** 🚀
