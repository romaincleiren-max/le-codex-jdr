# 🚀 Déploiement en Production - Le Codex avec Supabase

Guide complet pour déployer Le Codex en production avec Supabase comme base de données.

---

## 📋 Prérequis

- ✅ Compte Supabase actif
- ✅ Base de données Supabase configurée (tables créées)
- ✅ Variables d'environnement notées (SUPABASE_URL + SUPABASE_ANON_KEY)
- ✅ Build local testé (`npm run build` ✅)

---

## 🔐 Étape 1 : Préparer les Variables d'Environnement

Vos clés Supabase sont dans le fichier `.env` local :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

⚠️ **Important** : Le fichier `.env` n'est PAS poussé sur Git (c'est normal, il est dans `.gitignore`).

---

## 🌐 Étape 2 : Déployer sur Vercel (Recommandé)

### 2.1 - Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Inscrivez-vous avec GitHub (recommandé)

### 2.2 - Préparer le dépôt Git

Si ce n'est pas déjà fait :

```bash
# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Le Codex avec Supabase"

# Créer un dépôt sur GitHub puis :
git remote add origin https://github.com/votre-username/le-codex.git
git branch -M main
git push -u origin main
```

### 2.3 - Importer sur Vercel

1. **Sur Vercel** : Cliquez sur "New Project"
2. **Importer** votre dépôt GitHub
3. **Configuration** (Vercel détecte automatiquement Vite) :
   - Framework Preset : `Vite`
   - Build Command : `npm run build`
   - Output Directory : `dist`
   - Install Command : `npm install`

### 2.4 - ⚠️ IMPORTANT : Configurer les Variables d'Environnement

**Avant de déployer**, ajoutez vos variables d'environnement Supabase :

1. Dans Vercel, allez dans **Environment Variables**
2. Ajoutez ces 2 variables :

```
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = votre-clé-anon-publique
```

⚠️ **Copiez exactement les valeurs depuis votre fichier `.env` local**

3. Cliquez sur **"Deploy"**

### 2.5 - Déploiement

- Vercel va builder et déployer automatiquement
- Votre site sera accessible sur `https://votre-projet.vercel.app`
- **Chaque push sur GitHub déclenchera un redéploiement automatique** 🎉

---

## 🔄 Étape 3 : Tester le Site en Production

1. **Accédez à votre site** : `https://votre-projet.vercel.app`

2. **Vérifications** :
   - ✅ La page d'accueil s'affiche
   - ✅ Les 3 thèmes sont visibles
   - ✅ Connexion à l'Admin fonctionne (mot de passe : `admin123`)
   - ✅ Création d'une campagne de test fonctionne
   - ✅ Les données sont bien enregistrées dans Supabase

3. **Vérifier Supabase** :
   - Allez dans votre dashboard Supabase
   - Table `campaigns` : vous devriez voir votre campagne de test

---

## 🎨 Étape 4 : Configuration Post-Déploiement

### 4.1 - Connexion Admin

1. Allez sur `https://votre-site.vercel.app/admin`
2. Mot de passe par défaut : `admin123`
3. **Recommandé** : Changez le mot de passe dans Admin > Paramètres

### 4.2 - Créer votre Contenu

1. **Admin > Campagnes** : Créez vos premières campagnes
2. **Admin > Scénarios** : Ajoutez des scénarios à vos campagnes
3. **Admin > Page Accueil** : Personnalisez les images de fond
4. **Admin > Paramètres** : Changez le nom du site, ajoutez un logo

### 4.3 - Personnalisation Visuelle

- Nom du site
- Logo (utilisez Imgur pour héberger)
- Tagline
- Images de fond des thèmes

---

## 🌍 Alternative : Déployer sur Netlify

### Méthode 1 : Via Git (Recommandé)

1. **Créer un compte** sur [netlify.com](https://netlify.com)
2. **New site from Git** > Choisir votre dépôt GitHub
3. **Configuration** :
   - Build command : `npm run build`
   - Publish directory : `dist`
4. **⚠️ Variables d'environnement** :
   - Site settings > Environment > Environment variables
   - Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
5. **Deploy**

### Méthode 2 : Drag & Drop (Rapide mais manuel)

```bash
# Builder localement
npm run build

# Sur Netlify :
# - Glissez le dossier dist/ sur la zone de drop
# - ⚠️ Puis configurez les variables d'environnement
# - Redéployez
```

---

## 🔒 Sécurité Supabase

### Row Level Security (RLS)

Par défaut, vos tables sont **publiques**. Pour sécuriser :

1. **Dashboard Supabase** > Authentication > Policies
2. **Activez RLS** sur vos tables
3. **Créez des politiques** :

```sql
-- Exemple : Lecture publique, écriture authentifiée
CREATE POLICY "Lecture publique des campagnes"
ON campaigns FOR SELECT
USING (true);

CREATE POLICY "Écriture admin uniquement"
ON campaigns FOR INSERT
USING (auth.role() = 'authenticated');
```

### Variables d'Environnement

- ✅ `VITE_SUPABASE_ANON_KEY` : Clé publique, peut être exposée
- ❌ `SUPABASE_SERVICE_ROLE_KEY` : **NE JAMAIS exposer** côté client

---

## 📊 Étape 5 : Monitoring

### Supabase Dashboard

- **Table Editor** : Voir vos données en temps réel
- **SQL Editor** : Requêtes SQL personnalisées
- **Database** > Usage : Surveiller l'utilisation

### Vercel Dashboard

- **Deployments** : Historique des déploiements
- **Analytics** : Statistiques de trafic (gratuit)
- **Logs** : Console logs et erreurs

---

## 🔄 Workflow de Développement

### Développement Local

```bash
# 1. Travailler en local
npm run dev

# 2. Tester les modifications
# Les données vont dans votre Supabase (même DB que prod)

# 3. Commit & Push
git add .
git commit -m "Ajout de fonctionnalité X"
git push
```

### Déploiement Automatique

- Vercel détecte le push
- Build automatique
- Déploiement sur `https://votre-projet.vercel.app`
- **0 action manuelle nécessaire** 🎉

---

## 🆘 Résolution de Problèmes

### "Page blanche après déploiement"

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vercel > Settings > Environment Variables
2. Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien configurées
3. Redéployez : Deployments > ... > Redeploy

### "Supabase connection failed"

**Cause** : Mauvaise URL ou clé

**Solution** :
1. Vérifiez vos clés dans Supabase Dashboard > Project Settings > API
2. Comparez avec vos variables d'environnement sur Vercel
3. Redéployez après correction

### "Les routes ne fonctionnent pas"

**Cause** : Configuration SPA manquante

**Solution** : Le fichier `vercel.json` est déjà configuré ✅

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### "Les données ne se chargent pas"

1. **Vérifiez la console navigateur** (F12)
2. **Erreurs CORS** : Vérifiez que votre domaine Vercel est autorisé dans Supabase
3. **Supabase Dashboard** > Project Settings > API > CORS
4. Ajoutez votre domaine Vercel si nécessaire

---

## 🎯 Domaine Personnalisé

### Sur Vercel

1. **Settings** > **Domains**
2. **Add Domain** > Entrez votre domaine (ex: `lecodex.fr`)
3. **Configuration DNS** chez votre registrar :
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Attendez la propagation DNS (quelques minutes à 24h)
5. **SSL automatique** via Let's Encrypt ✅

### Sur Netlify

1. **Domain settings** > **Add custom domain**
2. Suivez les instructions DNS
3. SSL automatique ✅

---

## 📝 Checklist Finale Avant Production

### Technique

- ✅ Build réussit (`npm run build` sans erreur)
- ✅ Variables d'environnement configurées sur Vercel/Netlify
- ✅ Base de données Supabase opérationnelle
- ✅ Tables créées (campaigns, scenarios, themes, site_settings)
- ✅ Test de création de campagne réussi

### Contenu

- ✅ Au moins une campagne créée
- ✅ Images de fond des thèmes configurées
- ✅ Nom du site personnalisé
- ✅ Logo ajouté (optionnel)

### Sécurité

- ✅ Mot de passe admin changé
- ✅ RLS Supabase activé (recommandé)
- ✅ `.env` dans `.gitignore` ✅

---

## 🎉 Félicitations !

Votre site **Le Codex** est maintenant en production avec :

- ✅ **Base de données cloud** (Supabase)
- ✅ **Hébergement gratuit** (Vercel/Netlify)
- ✅ **SSL automatique** (HTTPS)
- ✅ **Déploiement automatique** (Git push = déploiement)
- ✅ **CDN mondial** (chargement rapide partout)
- ✅ **Scalable** (supporte des millions de requêtes)

---

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)

---

## 🔄 Prochaines Étapes

1. **Ajouter du contenu** : Créez vos campagnes et scénarios
2. **Partager** : Envoyez le lien à votre communauté
3. **Analyser** : Suivez les statistiques sur Vercel Analytics
4. **Améliorer** : Ajoutez des fonctionnalités (authentification, commentaires, etc.)

---

**Support** : Si vous rencontrez des problèmes, vérifiez :
1. Les logs Vercel (Deployments > votre déploiement > Building/Runtime Logs)
2. La console navigateur (F12 > Console)
3. Les logs Supabase (Dashboard > Logs)

**Bon déploiement !** 🚀
