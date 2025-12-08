# 📸 Configuration du Storage Supabase pour les Images

## Vue d'ensemble

Ce guide explique comment configurer un bucket de stockage pour les images dans Supabase Storage. Les images seront uploadées directement depuis l'interface admin et stockées de manière sécurisée.

## Étape 1 : Créer le bucket "images"

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Storage**
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   - **Name** : `images`
   - **Public bucket** : ✅ **Coché** (public pour affichage direct)
   - Cliquez sur **Create bucket**

## Étape 2 : Configurer les politiques de Storage

### Option A : Via l'interface (Recommandé)

1. Cliquez sur le bucket `images` que vous venez de créer
2. Cliquez sur **Policies** en haut
3. Cliquez sur **New policy** pour chaque politique ci-dessous

#### Politique 1 : Upload de fichiers (INSERT)

- **Policy name** : `Permettre upload public des images`
- **Policy definition** : Sélectionnez `Allow all operations` ou utilisez :
  ```sql
  true
  ```
- **Allowed operation** : ✅ **INSERT**
- **Target roles** : `public`
- Cliquez sur **Review** puis **Save policy**

#### Politique 2 : Lecture de fichiers (SELECT)

- **Policy name** : `Permettre lecture publique des images`
- **Policy definition** :
  ```sql
  true
  ```
- **Allowed operation** : ✅ **SELECT**  
- **Target roles** : `public`
- Cliquez sur **Review** puis **Save policy**

#### Politique 3 : Suppression de fichiers (DELETE)

- **Policy name** : `Permettre suppression publique des images`
- **Policy definition** :
  ```sql
  true
  ```
- **Allowed operation** : ✅ **DELETE**
- **Target roles** : `public`
- Cliquez sur **Review** puis **Save policy**

### Option B : Via SQL (Plus rapide)

Allez dans **SQL Editor** et exécutez ce script :

```sql
-- Créer les politiques pour le bucket images
-- 1. Politique pour l'upload
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Permettre upload public des images',
  'images',
  'true',
  ARRAY['INSERT'],
  ARRAY['public']
);

-- 2. Politique pour la lecture
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Permettre lecture publique des images',
  'images',
  'true',
  ARRAY['SELECT'],
  ARRAY['public']
);

-- 3. Politique pour la suppression
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Permettre suppression publique des images',
  'images',
  'true',
  ARRAY['DELETE'],
  ARRAY['public']
);
```

## Étape 3 : Vérifier la configuration

1. Dans Storage > images, vous devriez voir **3 policies** actives
2. Le bucket doit être **public** (icône globe)
3. Les URLs des images seront accessibles directement

## Structure des dossiers

Les images seront organisées automatiquement par catégorie :

```
images/
  ├── scenarios/         # Images des scénarios
  ├── campaigns/         # Images des campagnes
  ├── backgrounds/       # Images de fond
  ├── logos/            # Logos du site
  └── general/          # Images diverses
```

Exemple d'URL :
```
https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/scenarios/1733687123456-abc123.jpg
```

## Limites et sécurité

### Limites actuelles

- **Taille max par fichier** : 5 MB (défini dans le code)
- **Types acceptés** : JPG, PNG, GIF, WEBP
- **Stockage total** : Selon votre plan Supabase

### Améliorations de sécurité recommandées pour la production

Pour renforcer la sécurité en production, modifiez les politiques :

```sql
-- Politique d'upload plus restrictive (seulement pour les admins authentifiés)
CREATE POLICY "Upload restreint aux admins"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Politique de suppression restreinte aux admins
CREATE POLICY "Suppression restreinte aux admins"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Lecture publique (OK pour tout le monde)
CREATE POLICY "Lecture publique des images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

## Utilisation dans le code

### Upload d'une image

```javascript
import { supabaseService } from '../services/supabaseService';

// Upload d'un fichier
const file = event.target.files[0];
const { url } = await supabaseService.uploadImage(file, 'scenarios');

// url contient l'URL Supabase de l'image
console.log(url); // https://xxx.supabase.co/storage/v1/object/public/images/scenarios/xxx.jpg
```

### Utilisation du composant ImageUpload

```jsx
import { ImageUpload } from '../components/ImageUpload';

<ImageUpload
  value={scenario.imageUrl}
  onChange={(url) => setScenario({...scenario, imageUrl: url})}
  label="Image du scénario"
  folder="scenarios"
  aspectRatio="9:16"
  helpText="Image principale affichée en format vertical 9:16"
/>
```

## Test rapide

Pour tester que le Storage fonctionne :

1. Allez dans Storage > images
2. Cliquez sur **Upload file**
3. Sélectionnez une image
4. Vérifiez que l'upload réussit
5. Cliquez sur l'image pour obtenir l'URL publique
6. Ouvrez l'URL dans un navigateur pour vérifier qu'elle s'affiche

✅ Si tout fonctionne, vous pouvez utiliser le composant ImageUpload dans vos formulaires !

## Résolution de problèmes

### "Permission denied" lors de l'upload

- Vérifiez que le bucket existe
- Vérifiez que les 3 politiques sont actives
- Vérifiez que le bucket est public

### L'image ne s'affiche pas

- Vérifiez l'URL dans le navigateur
- Vérifiez que la politique SELECT est active
- Vérifiez que le bucket est public

### "File size too large"

- Le fichier dépasse 5MB
- Réduisez la taille de l'image avant l'upload

## Prochaines étapes

Une fois le bucket configuré :

1. ✅ Le composant `ImageUpload` fonctionnera automatiquement
2. ✅ Les images seront uploadées vers Supabase
3. ✅ Les URLs Supabase seront stockées dans la base de données
4. ✅ Les images s'afficheront sur le site

---

**🎨 Votre système d'upload d'images est maintenant prêt !**
