# 🔐 Création du Compte Admin - Instructions Urgentes

## ⚠️ Problème Actuel

Vous ne pouvez pas vous connecter car **le compte utilisateur n'a pas encore été créé dans Supabase Auth**.

## 📧 Email Admin Configuré

Votre email admin est : **`romain.cleiren@gmail.com`**

(Cet email est déjà enregistré dans la table `admin_users` via le script SQL)

---

## ✅ Solution : Créer le Compte dans Supabase Auth

### **Étape 1 : Aller sur Supabase Authentication**

1. Ouvrez ce lien : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/auth/users
2. Connectez-vous à Supabase si nécessaire

### **Étape 2 : Créer votre compte admin**

1. Cliquez sur le bouton **"Add user"** (en haut à droite)
2. Sélectionnez **"Create new user"**
3. Remplissez le formulaire :
   
   ```
   Email: romain.cleiren@gmail.com
   Password: [CHOISISSEZ UN MOT DE PASSE SÉCURISÉ - minimum 8 caractères]
   ```
   
   **IMPORTANT** : 
   - ✅ **Cochez "Auto Confirm User"** pour activer le compte immédiatement
   - ❌ Décochez "Send confirmation email" (pas nécessaire)

4. Cliquez sur **"Create user"**

### **Étape 3 : Tester la connexion**

#### En local (http://localhost:5173 ou http://localhost:3000)

1. Lancez l'application si elle n'est pas déjà lancée :
   ```bash
   npm run dev
   ```

2. Allez sur : http://localhost:5173/login (ou /admin)

3. Connectez-vous avec :
   - **Email** : `romain.cleiren@gmail.com`
   - **Mot de passe** : celui que vous avez créé à l'étape 2

4. Si tout fonctionne → ✅ Vous êtes redirigé vers `/admin`

#### En production (sur Vercel)

La même chose fonctionne directement sur votre site déployé !

---

## 🔧 Si vous voulez utiliser un AUTRE email

Si vous préférez utiliser un autre email que `romain.cleiren@gmail.com`, suivez ces étapes :

### **Option A : Ajouter un autre admin en plus**

1. Dans Supabase SQL Editor : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/sql/new

2. Exécutez ce SQL :
   ```sql
   INSERT INTO admin_users (email) VALUES ('VOTRE_AUTRE_EMAIL@exemple.com')
   ON CONFLICT (email) DO NOTHING;
   ```

3. Puis créez le compte dans Authentication (Étape 2 ci-dessus avec votre nouvel email)

### **Option B : Remplacer l'email existant**

1. Dans Supabase SQL Editor, exécutez :
   ```sql
   UPDATE admin_users 
   SET email = 'VOTRE_NOUVEL_EMAIL@exemple.com' 
   WHERE email = 'romain.cleiren@gmail.com';
   ```

2. Puis créez le compte dans Authentication avec ce nouvel email

---

## 📝 Récapitulatif

### Ce qui est DÉJÀ configuré ✅
- ✅ Table `admin_users` créée
- ✅ Email `romain.cleiren@gmail.com` enregistré dans `admin_users`
- ✅ Politiques RLS configurées
- ✅ Frontend configuré pour l'authentification Supabase

### Ce qui MANQUE ❌
- ❌ **Le compte utilisateur dans Supabase Auth**

### Ce que vous devez faire MAINTENANT 🚀
1. Aller sur : https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/auth/users
2. Cliquer sur "Add user" → "Create new user"
3. Email : `romain.cleiren@gmail.com`
4. Password : [votre mot de passe]
5. Cocher "Auto Confirm User"
6. Créer le compte
7. Se connecter sur /login

---

## ❓ Questions Fréquentes

### Quel mot de passe dois-je utiliser ?

Choisissez un mot de passe sécurisé de votre choix (minimum 8 caractères). Ce sera le mot de passe que vous utiliserez pour vous connecter à l'interface admin.

### Dois-je utiliser `romain.cleiren@gmail.com` ?

Oui, c'est celui qui est déjà configuré dans la base de données. Mais vous pouvez en ajouter d'autres ou le changer (voir section ci-dessus).

### Est-ce que je dois réexécuter le script SQL ?

Non ! Le script SQL a déjà été exécuté. Vous devez juste créer le **compte utilisateur** dans Supabase Authentication.

### Pourquoi ça ne fonctionnait pas avant ?

Parce qu'il y a **2 étapes distinctes** :
1. Enregistrer l'email dans `admin_users` (✅ FAIT via le script SQL)
2. Créer le compte utilisateur dans Supabase Auth (❌ PAS ENCORE FAIT)

Les deux doivent correspondre pour que la connexion fonctionne.

---

## 🎯 Action Immédiate

**➡️ Cliquez ici pour créer votre compte maintenant :**

https://supabase.com/dashboard/project/csgndyapcoymkynbvckg/auth/users

Puis cliquez sur "Add user" et suivez les instructions de l'Étape 2.

---

## ✅ Après la création

Une fois le compte créé, vous pourrez vous connecter sur :
- **Local** : http://localhost:5173/login
- **Production** : https://votre-site.vercel.app/login

Avec :
- Email : `romain.cleiren@gmail.com`
- Password : celui que vous avez défini

---

🎉 **C'est tout ! Une fois le compte créé dans Supabase Auth, tout fonctionnera immédiatement !**
