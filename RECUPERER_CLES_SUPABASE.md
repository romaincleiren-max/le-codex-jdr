# 🔑 Récupérer vos clés Supabase

## ⚠️ PROBLÈME ACTUEL

Votre fichier `.env` contient une clé Supabase incorrecte/tronquée :
```
VITE_SUPABASE_ANON_KEY=sb_publishable_NFwYRzjSEldCmXqKb9Q6Ng_tUjo0kiN
```

Cette clé est beaucoup trop courte ! Les vraies clés Supabase font environ 150+ caractères.

---

## ✅ SOLUTION : Récupérer les vraies clés

### Étape 1 : Aller sur les paramètres Supabase

1. Ouvrez ce lien : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/settings/api

2. Vous verrez une page "Project API keys"

### Étape 2 : Copier les clés

Dans la section "Project API keys", vous verrez :

- **Project URL** : `https://csgndyapcoymkynbvckg.supabase.co` ✅ (celle-ci est bonne)
- **anon / public** : Une TRÈS LONGUE clé qui commence par `eyJ...`
- **service_role** : Une autre TRÈS LONGUE clé qui commence aussi par `eyJ...`

### Étape 3 : Mettre à jour votre fichier .env

Copiez les valeurs et remplacez dans votre fichier `.env` :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://csgndyapcoymkynbvckg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZ25keWFwY295bWt5bmJ2Y2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NTQzNjIsImV4cCI6MjA0OTIzMDM2Mn0....
```

⚠️ **ATTENTION** : La clé doit être TRÈS LONGUE (plus de 100 caractères) !

### Étape 4 : Redémarrer le serveur local

Une fois le fichier `.env` mis à jour :

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Relancez : `npm run dev`
3. Testez la connexion

---

## 🚀 Pour la production (Vercel)

Vous devez AUSSI mettre à jour les variables d'environnement sur Vercel :

1. Allez sur : https://vercel.com/romaincleiren-maxs-projects/le-codex-jdr/settings/environment-variables

2. Vérifiez/mettez à jour :
   - `VITE_SUPABASE_URL` : https://csgndyapcoymkynbvckg.supabase.co
   - `VITE_SUPABASE_ANON_KEY` : La LONGUE clé que vous avez copiée

3. Redéployez : Vercel → Deployments → Redeploy

---

## 📋 Vérification

Une fois les clés mises à jour, vous devriez pouvoir :
- Vous connecter avec votre email et mot de passe
- Voir les logs d'authentification dans la console du navigateur
- Être redirigé vers `/admin` après connexion

---

## ❓ Comment vérifier si mes clés sont correctes ?

✅ **Bonnes clés** :
- Commence par `eyJ`
- Fait plus de 100 caractères
- Contient des points (`.`) qui séparent différentes parties

❌ **Mauvaises clés** :
- Commence par `sb_publishable_` ou `sb_secret_`
- Fait moins de 50 caractères
- A l'air tronquée/incomplète

---

💡 **Astuce** : Vous pouvez tester vos clés en ouvrant la console du navigateur (F12) et en regardant les erreurs réseau quand vous essayez de vous connecter. Si vous voyez "401 Unauthorized" ou "Invalid API key", c'est que les clés sont incorrectes.
