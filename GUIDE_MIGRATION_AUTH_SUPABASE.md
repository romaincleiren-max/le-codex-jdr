# 🔐 Guide de Migration vers Supabase Auth

## Résumé des changements

Votre application utilise maintenant **Supabase Auth** pour une authentification sécurisée des administrateurs.

### ✅ Ce qui a été modifié :

1. **LoginPage.jsx** : Connexion avec email + mot de passe via Supabase Auth
2. **ProtectedRoute.jsx** : Vérification de session Supabase + vérification du statut admin
3. **Politiques RLS** : Seuls les utilisateurs authentifiés ET dans `admin_users` peuvent modifier les données

---

## 📋 Étapes à suivre (dans l'ordre)

### **Étape 1 : Préparer le script SQL**

1. Ouvrez le fichier `supabase/SETUP_ADMIN_AUTH.sql`
2. **Ligne 26** : Remplacez `'votre-email@exemple.com'` par **votre vrai email**
   ```sql
   INSERT INTO admin_users (email) VALUES ('votre.email@gmail.com')
   ```
3. Sauvegardez le fichier

---

### **Étape 2 : Exécuter le script sur Supabase**

1. Allez sur : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/sql/new
2. Copiez **tout le contenu** de `supabase/SETUP_ADMIN_AUTH.sql`
3. Collez dans l'éditeur SQL
4. Cliquez sur **"Run"** (en bas à droite)
5. Attendez le message : **"Success. No rows returned"**

✅ Cela crée :
- La table `admin_users` avec votre email
- Les politiques RLS sécurisées pour campagnes, scénarios, thèmes, etc.

---

### **Étape 3 : Activer Email Auth sur Supabase**

1. Allez sur : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/auth/providers
2. Dans la section **"Email"**, vérifiez qu'elle est activée (normalement oui par défaut)
3. Désactivez **"Confirm email"** pour simplifier :
   - Settings → Email Auth → Décochez "Enable email confirmations"

---

### **Étape 4 : Créer votre compte admin**

1. Allez sur : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/auth/users
2. Cliquez sur **"Add user"** → **"Create new user"**
3. Remplissez :
   - **Email** : Le même email que dans `admin_users` (étape 1)
   - **Password** : Votre mot de passe sécurisé (minimum 8 caractères)
   - **Auto Confirm User** : ✅ **Cochez cette case** pour activer le compte immédiatement
4. Cliquez sur **"Create user"**

✅ Votre compte admin est créé !

---

### **Étape 5 : Tester localement**

1. Dans le terminal, lancez l'application :
   ```bash
   npm run dev
   ```

2. Allez sur : http://localhost:5173/login

3. Connectez-vous avec :
   - **Email** : celui que vous avez créé
   - **Mot de passe** : celui que vous avez défini

4. Si tout fonctionne :
   - ✅ Vous êtes redirigé vers `/admin`
   - ✅ Vous pouvez créer/modifier des campagnes
   - ✅ Les données sont sauvegardées dans Supabase

---

### **Étape 6 : Déployer en production**

Une fois que les tests locaux fonctionnent :

```bash
git add .
git commit -m "feat: Migration vers Supabase Auth pour authentification admin"
git push origin main
```

Vercel va automatiquement redéployer l'application (1-2 minutes).

---

## 🔒 Sécurité

### ✅ Avantages de cette solution :

- **Authentification robuste** : Gestion native par Supabase
- **RLS sécurisé** : Seuls les admins dans `admin_users` peuvent modifier les données
- **Sessions gérées** : Expiration automatique, refresh tokens
- **Logs d'authentification** : Visible dans Supabase Dashboard
- **Multi-admins** : Facile d'ajouter d'autres administrateurs

### 🔐 Les visiteurs du site peuvent toujours :

- ✅ Voir les campagnes et scénarios (lecture publique)
- ✅ Soumettre des scénarios
- ❌ NE PEUVENT PAS modifier, créer ou supprimer des données

### 👥 Ajouter un nouvel administrateur :

1. **Dans Supabase SQL Editor** :
   ```sql
   INSERT INTO admin_users (email) VALUES ('nouveau.admin@exemple.com');
   ```

2. **Dans Authentication → Users** :
   - Créez le compte utilisateur avec cet email
   - Auto-confirmez le compte

---

## ❌ Dépannage

### Erreur "new row violates row-level security policy"

- ✅ Vérifiez que le script SQL a bien été exécuté
- ✅ Vérifiez que votre email est dans la table `admin_users`
- ✅ Vérifiez que vous êtes bien connecté (session active)

### Erreur "Accès non autorisé"

- ✅ Votre email dans Supabase Auth doit correspondre exactement à celui dans `admin_users`
- ✅ Vérifiez dans : Dashboard → Authentication → Users

### Impossible de se connecter

- ✅ Vérifiez que le compte est bien "Confirmed" dans Supabase
- ✅ Vérifiez que Email Auth est activé
- ✅ Essayez de réinitialiser le mot de passe dans Supabase Dashboard

---

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. La console du navigateur (F12) pour les erreurs JavaScript
2. Les logs Supabase : Dashboard → Logs
3. Que toutes les étapes ont été suivies dans l'ordre

---

## 🎉 Félicitations !

Votre application utilise maintenant une authentification professionnelle et sécurisée ! 🚀
