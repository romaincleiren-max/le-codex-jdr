# 📄 Configuration du Storage Supabase pour les PDFs (Bucket Privé)

## Vue d'ensemble

Ce guide explique comment configurer un bucket de stockage **PRIVÉ** pour les PDFs vendus. Les fichiers ne seront **JAMAIS** accessibles publiquement - seules des URLs signées temporaires (5 minutes) seront générées lors du téléchargement.

## 🔒 Sécurité

**IMPORTANT** : Ce bucket doit être PRIVÉ (pas public) pour protéger vos PDFs payants.

## Étape 1 : Créer le bucket "pdfs"

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Storage**
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   - **Name** : `pdfs`
   - **Public bucket** : ❌ **DÉCOCHÉ** (PRIVÉ - crucial pour la sécurité)
   - Cliquez sur **Create bucket**

## Étape 2 : Configurer les politiques de Storage

### Politique 1 : Upload restreint (INSERT)

Les PDFs ne peuvent être uploadés que par l'application (service role).

1. Cliquez sur le bucket `pdfs` 
2. Cliquez sur **Policies** en haut
3. Cliquez sur **New policy**

Configuration :
- **Policy name** : `Upload via service role only`
- **Policy definition** :
  ```sql
  false
  ```
- **Allowed operation** : ✅ **INSERT**
- **Target roles** : `authenticated`, `public`

> **Note** : `false` signifie que seul le service role (depuis le backend) peut uploader. Les utilisateurs ne peuvent pas uploader directement.

### Politique 2 : Pas de lecture publique (SELECT)

Les PDFs ne doivent jamais être lisibles publiquement.

- **Policy name** : `Pas de lecture publique`
- **Policy definition** :
  ```sql
  false
  ```
- **Allowed operation** : ✅ **SELECT**
- **Target roles** : `public`, `authenticated`

> **Note** : Les téléchargements se feront via URLs signées générées par le code

### Politique 3 : Suppression via service role (DELETE)

Seul l'admin peut supprimer des PDFs.

- **Policy name** : `Suppression via service role`
- **Policy definition** :
  ```sql
  false
  ```
- **Allowed operation** : ✅ **DELETE**
- **Target roles** : `public`, `authenticated`

### Alternative : Configuration via SQL

Allez dans **SQL Editor** et exécutez :

```sql
-- Politiques pour le bucket pdfs (TOUT BLOQUÉ sauf service role)

-- Bloquer l'upload public
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Upload via service role only',
  'pdfs',
  'false',
  ARRAY['INSERT'],
  ARRAY['authenticated', 'public']
);

-- Bloquer la lecture publique
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Pas de lecture publique',
  'pdfs',
  'false',
  ARRAY['SELECT'],
  ARRAY['authenticated', 'public']
);

-- Bloquer la suppression publique
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Suppression via service role',
  'pdfs',
  'false',
  ARRAY['DELETE'],
  ARRAY['authenticated', 'public']
);
```

## Étape 3 : Obtenir la clé Service Role

Pour uploader/télécharger les PDFs, vous aurez besoin de la **Service Role Key** (différente de la clé anon).

1. Allez dans **Settings** > **API**
2. Section **Project API keys**
3. Copiez la clé **service_role** (commence par `eyJ...`)
4. **⚠️ DANGER** : Cette clé donne tous les droits. Ne jamais l'exposer côté client !

### Configuration dans .env

Ajoutez dans votre fichier `.env` :

```env
# Service Role Key (BACKEND ONLY - Ne jamais exposer côté client!)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

**IMPORTANT** :
- ✅ Utilisez cette clé **uniquement côté backend/serveur**
- ❌ **JAMAIS** dans du code client (React/Vue/etc.)
- ✅ Ajoutez `.env` dans `.gitignore`
- ✅ Configurez cette variable sur Vercel (Environment Variables)

## Étape 4 : Vérifier la configuration

1. Dans Storage > pdfs, vous devriez voir **3 policies** actives (toutes avec `false`)
2. Le bucket doit être **PRIVÉ** (pas d'icône globe)
3. Essayez d'accéder à un fichier via l'URL publique → doit être **refusé** ❌

## Structure des dossiers recommandée

```
pdfs/
  ├── campaigns/          # PDFs de campagnes complètes
  │   └── campaign-uuid.pdf
  ├── scenarios/          # PDFs de scénarios individuels
  │   └── scenario-uuid.pdf
  └── standalone/         # Produits standalone
      └── product-uuid.pdf
```

## Utilisation dans le code

### Upload d'un PDF (Backend/Service Role uniquement)

```javascript
import { createClient } from '@supabase/supabase-js';

// Client avec service role (BACKEND ONLY)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Upload
const file = req.file; // depuis formulaire
const filePath = `campaigns/${productId}.pdf`;

const { data, error } = await supabaseAdmin.storage
  .from('pdfs')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### Génération d'URL signée (temporaire)

```javascript
// Générer une URL valide 5 minutes
const { data, error } = await supabaseAdmin.storage
  .from('pdfs')
  .createSignedUrl('campaigns/product-id.pdf', 300); // 300 secondes = 5 min

// data.signedUrl contient l'URL temporaire
console.log(data.signedUrl); 
// https://xxx.supabase.co/storage/v1/object/sign/pdfs/campaigns/xxx.pdf?token=xxx&exp=xxx
```

### Workflow de téléchargement sécurisé

```
1. Utilisateur clique sur lien avec token
   ↓
2. Backend vérifie le token (valid, pas expiré, quota OK)
   ↓
3. Si OK : Génère URL signée (5 min) avec service role
   ↓
4. Redirige utilisateur vers URL signée
   ↓
5. Téléchargement du PDF
   ↓
6. Incrémente compteur de téléchargements
```

## Sécurité avancée

### Limites de taille

Dans l'interface Supabase :
1. Storage > pdfs > Settings
2. Configurez **Max file size** : 50 MB (recommandé)

### Chiffrement

Les fichiers dans Supabase Storage sont :
- ✅ Chiffrés au repos (AES-256)
- ✅ Transférés via HTTPS (TLS 1.3)
- ✅ Isolés par projet

### Monitoring

Surveillez les accès suspects :
1. Storage > pdfs > Logs
2. Vérifiez les tentatives d'accès non autorisées
3. Alertes si trop de téléchargements

## Résolution de problèmes

### "Permission denied" lors de l'upload

❌ **Cause** : Vous essayez d'uploader avec la clé `anon` (client)
✅ **Solution** : Utilisez la `service_role` key côté backend

### "File not found" lors du téléchargement

❌ **Cause** : Vous essayez d'accéder avec une URL publique
✅ **Solution** : Générez une URL signée avec `createSignedUrl()`

### URL signée expirée

❌ **Cause** : Plus de 5 minutes se sont écoulées
✅ **Solution** : Régénérez une nouvelle URL signée

## Test de configuration

### Test 1 : Vérifier que le bucket est privé

```bash
# Essayez d'accéder à un fichier (doit échouer)
curl https://YOUR_PROJECT.supabase.co/storage/v1/object/public/pdfs/test.pdf
# Attendu : 404 ou erreur "not found"
```

### Test 2 : Upload via service role

```javascript
const { data, error } = await supabaseAdmin.storage
  .from('pdfs')
  .upload('test.pdf', fileBuffer);

console.log(data); // Doit réussir
```

### Test 3 : Générer URL signée

```javascript
const { data } = await supabaseAdmin.storage
  .from('pdfs')
  .createSignedUrl('test.pdf', 60);

console.log(data.signedUrl); // URL valide 60 secondes
```

## Checklist de sécurité

Avant de passer en production :

- [ ] Bucket "pdfs" créé en mode **PRIVÉ**
- [ ] 3 politiques avec `false` configurées
- [ ] Service role key dans `.env` (pas commitée)
- [ ] Service role key configurée sur Vercel
- [ ] Test : URL publique refuse l'accès
- [ ] Test : Upload via service role fonctionne
- [ ] Test : URL signée fonctionne et expire
- [ ] Monitoring des logs activé

## Prochaines étapes

Une fois le bucket configuré :

1. ✅ Créer les services d'upload/download
2. ✅ Créer la page admin avec upload de PDF
3. ✅ Implémenter le système de tokens
4. ✅ Intégrer Stripe pour les paiements
5. ✅ Tester le workflow complet

---

**🔒 Votre système de PDFs sécurisé est maintenant prêt !**
