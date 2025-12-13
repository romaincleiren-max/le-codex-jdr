# 📦 Configuration du Bucket Submissions

## Problème actuel
Le téléchargement des PDFs échoue avec "Object not found" car les permissions du bucket ne sont pas correctement configurées pour les URLs signées.

## ✅ Solution : Configurer les politiques via l'interface Supabase

### Étape 1 : Accéder aux politiques du bucket

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **"Storage"**
4. Cliquez sur le bucket **"submissions"**
5. Cliquez sur l'onglet **"Policies"**

### Étape 2 : Supprimer les anciennes politiques

Si des politiques existent déjà :
- Cliquez sur les **3 points** à droite de chaque politique
- Sélectionnez **"Delete policy"**
- Confirmez la suppression

### Étape 3 : Créer les nouvelles politiques

#### Politique 1 : Upload public

1. Cliquez sur **"New Policy"**
2. Sélectionnez **"For full customization"**
3. Configurez :
   - **Policy name** : `Public can upload submissions`
   - **Allowed operation** : Cochez **INSERT** uniquement
   - **Policy definition** : Tapez `true`
   - **Target roles** : Sélectionnez **public**
4. Cliquez **"Save policy"**

#### Politique 2 : Lecture authentifiée (pour URLs signées)

1. Cliquez sur **"New Policy"** à nouveau
2. Sélectionnez **"For full customization"**
3. Configurez :
   - **Policy name** : `Authenticated users can read submissions`
   - **Allowed operation** : Cochez **SELECT** uniquement
   - **Policy definition** : Tapez `true`
   - **Target roles** : Sélectionnez **authenticated**
4. Cliquez **"Save policy"**

#### Politique 3 : Suppression authentifiée

1. Cliquez sur **"New Policy"** une dernière fois
2. Sélectionnez **"For full customization"**
3. Configurez :
   - **Policy name** : `Authenticated users can delete submissions`
   - **Allowed operation** : Cochez **DELETE** uniquement
   - **Policy definition** : Tapez `true`
   - **Target roles** : Sélectionnez **authenticated**
4. Cliquez **"Save policy"**

---

## 🧪 Test après configuration

1. Allez sur https://le-codex-jdr.vercel.app
2. Page **"Proposer"**
3. **Soumettez un nouveau PDF de test**
4. Connectez-vous en **admin**
5. Onglet **"Soumissions"**
6. Cliquez **"📥 Télécharger PDF"**
7. Le téléchargement devrait maintenant fonctionner ✅

---

## 💡 Notes importantes

- Le bucket **DOIT rester PRIVÉ** (case "Public bucket" décochée)
- Les URLs signées permettent un accès temporaire (5 minutes) aux fichiers
- Seuls les admins authentifiés peuvent télécharger les PDFs
- Les utilisateurs publics peuvent uniquement soumettre (upload)
