# 🚀 Déploiement sur Vercel - Guide Étape par Étape

## ✅ Compte Vercel créé - Voici la suite !

---

## Étape 1 : Préparer votre Code (Git)

### Option A : Vous avez déjà Git configuré

Si vous avez déjà initialisé Git et poussé sur GitHub, passez directement à l'Étape 2.

### Option B : Première fois avec Git

```bash
# 1. Initialiser Git dans le projet
git init

# 2. Ajouter tous les fichiers
git add .

# 3. Premier commit
git commit -m "Initial commit - Le Codex avec Supabase"
```

**Ensuite, créez un dépôt sur GitHub :**

1. Allez sur [github.com](https://github.com)
2. Cliquez sur **"+"** en haut à droite → **"New repository"**
3. Nom du repo : `le-codex` (ou autre nom)
4. **NE PAS** cocher "Initialize with README" (votre code existe déjà)
5. Cliquez sur **"Create repository"**

**GitHub vous donne des commandes, utilisez celles-ci :**

```bash
# Connecter votre projet local à GitHub
git remote add origin https://github.com/VOTRE-USERNAME/le-codex.git

# Pousser le code
git branch -M main
git push -u origin main
```

✅ Votre code est maintenant sur GitHub !

---

## Étape 2 : Importer le Projet sur Vercel

### 2.1 - Accéder au Dashboard Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Vous devriez voir votre tableau de bord Vercel

### 2.2 - Créer un Nouveau Projet

1. Cliquez sur le bouton **"Add New..."** ou **"New Project"**
2. Vercel vous demande d'importer un dépôt Git

### 2.3 - Connecter GitHub (si pas déjà fait)

1. Cliquez sur **"Continue with GitHub"**
2. Autorisez Vercel à accéder à vos repos GitHub
3. Vous verrez la liste de vos dépôts

### 2.4 - Sélectionner le Projet

1. Trouvez **"le-codex"** dans la liste
2. Cliquez sur **"Import"**

---

## Étape 3 : ⚠️ IMPORTANT - Configurer le Projet

Vercel va afficher un écran de configuration. Voici ce qu'il faut faire :

### 3.1 - Configuration Détectée Automatiquement

Vercel devrait détecter automatiquement :
- **Framework Preset** : `Vite`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

✅ **Ces valeurs sont correctes, ne les changez pas !**

### 3.2 - ⚠️ CRUCIAL - Variables d'Environnement

**AVANT de cliquer sur Deploy**, vous DEVEZ ajouter vos variables Supabase :

1. **Déroulez la section "Environment Variables"** (cliquez pour ouvrir)

2. **Ajoutez ces 2 variables** :

   **Variable 1 :**
   ```
   Name: VITE_SUPABASE_URL
   Value: [Copiez depuis votre fichier .env]
   ```
   
   **Variable 2 :**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: [Copiez depuis votre fichier .env]
   ```

3. **Où trouver ces valeurs ?**
   - Ouvrez votre fichier `.env` dans VS Code
   - Copiez la valeur EXACTE après le `=`
   - **Exemple de .env** :
     ```env
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg...
     ```

4. **Pour chaque variable** :
   - Cliquez sur **"Add"**
   - Name : tapez le nom (ex: `VITE_SUPABASE_URL`)
   - Value : collez la valeur depuis votre .env
   - Environnement : **Laissez tout coché** (Production, Preview, Development)
   - Cliquez sur **"Add"**

### 3.3 - Root Directory

- **Root Directory** : Laissez vide ou `./` (c'est la racine du projet)

---

## Étape 4 : Déployer ! 🚀

1. Une fois les variables d'environnement ajoutées, cliquez sur **"Deploy"**

2. Vercel va :
   - ⏳ Cloner votre code depuis GitHub
   - ⏳ Installer les dépendances (`npm install`)
   - ⏳ Builder l'application (`npm run build`)
   - ⏳ Déployer sur le CDN mondial

3. **Durée** : 1-3 minutes en général

4. **Succès !** 🎉
   - Vous verrez un écran de félicitations
   - Un lien vers votre site : `https://le-codex-xxxxx.vercel.app`

---

## Étape 5 : Tester Votre Site en Production

### 5.1 - Accéder au Site

1. Cliquez sur le lien Vercel (ou sur **"Visit"**)
2. Votre site s'ouvre dans un nouvel onglet

### 5.2 - Vérifications

✅ **Page d'accueil** : Les 3 thèmes doivent s'afficher (Médiéval, Lovecraft, Sci-Fi)

✅ **Navigation** : Cliquez sur un thème pour vérifier que ça fonctionne

✅ **Admin** : 
   - Ajoutez `/admin` à l'URL : `https://votre-site.vercel.app/admin`
   - Mot de passe : `admin123`
   - Essayez de créer une campagne de test

✅ **Supabase** :
   - Allez sur votre Dashboard Supabase
   - Table Editor → `campaigns`
   - Vous devriez voir la campagne que vous venez de créer !

---

## Étape 6 : Personnaliser le Domaine (Optionnel)

### URL Actuelle (Gratuit)
`https://le-codex-xxxxx.vercel.app`

### Pour un Domaine Personnalisé

1. Dans Vercel Dashboard, cliquez sur votre projet
2. **Settings** → **Domains**
3. **Add** → Entrez votre domaine
4. Suivez les instructions DNS

---

## 🔄 Workflow Futur (Déploiement Automatique)

**C'est la magie de Vercel !** À partir de maintenant :

```bash
# 1. Faites des modifications dans votre code
# 2. Committez
git add .
git commit -m "Ajout de nouvelles fonctionnalités"

# 3. Poussez sur GitHub
git push

# 4. Vercel détecte automatiquement le push
# → Build automatique
# → Déploiement automatique
# → Votre site est mis à jour en ~1 minute !
```

**Vous n'avez plus RIEN à faire manuellement !** 🎉

---

## 🆘 Problèmes Courants

### "Page blanche" après déploiement

**Cause** : Variables d'environnement manquantes ou incorrectes

**Solution** :
1. Dashboard Vercel → Votre projet → **Settings** → **Environment Variables**
2. Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien présentes
3. Vérifiez les valeurs (comparez avec votre `.env` local)
4. Si modifiées, allez dans **Deployments** → **...** → **Redeploy**

### "Build Failed"

**Cause** : Erreur de build

**Solution** :
1. Cliquez sur le déploiement échoué
2. Consultez les logs (onglet **"Building"**)
3. L'erreur est affichée en rouge
4. Corrigez dans votre code local
5. Push sur GitHub → Nouveau déploiement automatique

### "Cannot connect to Supabase"

**Cause** : URL ou clé Supabase incorrecte

**Solution** :
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Votre projet → **Settings** → **API**
3. Vérifiez **Project URL** et **anon public** key
4. Comparez avec vos variables sur Vercel
5. Corrigez si nécessaire et redéployez

---

## 📊 Dashboard Vercel - Fonctionnalités Utiles

### Deployments
- **Historique** : Voir tous les déploiements
- **Logs** : Console logs et erreurs
- **Redeploy** : Redéployer sans nouveau commit

### Analytics (Gratuit)
- **Visiteurs** : Nombre de visites
- **Pages vues** : Pages les plus consultées
- **Performances** : Temps de chargement

### Settings
- **Environment Variables** : Gérer vos variables
- **Domains** : Configurer des domaines personnalisés
- **Git** : Changer de branche de déploiement

---

## ✅ Checklist Post-Déploiement

### Immédiatement
- ⬜ Site accessible et pages chargent
- ⬜ Admin fonctionne (`/admin`)
- ⬜ Création d'une campagne de test réussie
- ⬜ Données visibles dans Supabase

### Dans les 24h
- ⬜ Changer le mot de passe admin (Admin → Paramètres)
- ⬜ Ajouter du vrai contenu (campagnes)
- ⬜ Personnaliser le site (nom, logo)
- ⬜ Configurer les images de fond des thèmes

### Cette semaine
- ⬜ Activer RLS sur Supabase (sécurité)
- ⬜ Tester le site sur mobile
- ⬜ Partager le lien avec vos premiers utilisateurs

---

## 🎉 Félicitations !

Votre site **Le Codex** est maintenant en ligne et accessible à tous !

**URL de votre site** : `https://le-codex-xxxxx.vercel.app`

---

## 📝 Prochaines Actions Recommandées

1. **Testez tout** : Navigation, admin, création de campagnes
2. **Ajoutez du contenu** : Créez vos premières vraies campagnes
3. **Personnalisez** : Logo, nom du site, images
4. **Partagez** : Envoyez le lien à votre communauté
5. **Surveillez** : Consultez les Analytics Vercel

---

## 💡 Conseils Pro

### Prévisualisation des Modifications

- Créez une branche Git : `git checkout -b dev`
- Faites vos modifs et push : `git push origin dev`
- Vercel crée automatiquement un **Preview Deployment**
- Testez avant de merger dans `main`

### Domaine Personnalisé

Un domaine comme `lecodex.fr` coûte ~10€/an et rend le site plus professionnel :
1. Achetez sur Namecheap, OVH, Google Domains
2. Ajoutez-le dans Vercel Settings → Domains
3. Configurez les DNS (Vercel vous guide)

### Monitoring

- Installez Vercel Analytics (gratuit) pour suivre le trafic
- Configurez des alertes email en cas d'erreur

---

**Besoin d'aide ?** Consultez la [documentation Vercel](https://vercel.com/docs) ou posez vos questions !

**Bon déploiement !** 🚀
