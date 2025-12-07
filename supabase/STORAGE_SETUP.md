# Configuration du Storage Supabase pour les soumissions de PDF

## Étape 1 : Créer le bucket de stockage

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Storage**
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   - **Name** : `submissions`
   - **Public bucket** : ❌ **Décoché** (privé pour sécurité)
   - Cliquez sur **Create bucket**

## Étape 2 : Configurer les politiques de Storage

1. Cliquez sur le bucket `submissions` que vous venez de créer
2. Cliquez sur **Policies** en haut
3. Cliquez sur **New policy**

### Politique 1 : Upload de fichiers (INSERT)

- **Policy name** : `Permettre upload public`
- **Definition** : 
  ```sql
  (bucket_id = 'submissions')
  ```
- **Allowed operation** : ✅ **INSERT**
- **Target roles** : `public`
- Cliquez sur **Review** puis **Save policy**

### Politique 2 : Lecture de fichiers (SELECT)

- **Policy name** : `Permettre lecture publique`
- **Definition** : 
  ```sql
  (bucket_id = 'submissions')
  ```
- **Allowed operation** : ✅ **SELECT**
- **Target roles** : `public`
- Cliquez sur **Review** puis **Save policy**

### Politique 3 : Suppression de fichiers (DELETE)

- **Policy name** : `Permettre suppression publique`
- **Definition** : 
  ```sql
  (bucket_id = 'submissions')
  ```
- **Allowed operation** : ✅ **DELETE**
- **Target roles** : `public`
- Cliquez sur **Review** puis **Save policy**

## Alternative rapide : SQL pour toutes les politiques

Vous pouvez aussi exécuter ce SQL dans l'éditeur SQL :

```sql
-- Politique pour l'upload
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Permettre upload public',
  'submissions',
  '(bucket_id = ''submissions'')',
  ARRAY['INSERT'],
  ARRAY['public']
);

-- Politique pour la lecture
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Permettre lecture publique',
  'submissions',
  '(bucket_id = ''submissions'')',
  ARRAY['SELECT'],
  ARRAY['public']
);

-- Politique pour la suppression
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Permettre suppression publique',
  'submissions',
  '(bucket_id = ''submissions'')',
  ARRAY['DELETE'],
  ARRAY['public']
);
```

## Étape 3 : Vérifier la configuration

1. Dans Storage > submissions, vous devriez voir **3 policies** actives
2. Le bucket doit être **privé** (non public)
3. Les PDFs uploadés seront accessibles uniquement via des URLs signées

## Structure des fichiers

Les PDFs seront stockés avec cette structure :
```
submissions/
  └── {uuid}-{nom-du-fichier}.pdf
```

Exemple : `submissions/550e8400-e29b-41d4-a716-446655440000-mon-scenario.pdf`

## Notes de sécurité

⚠️ **Important** : Les politiques actuelles sont permissives pour simplifier le développement. 

En production, vous devriez :
- Restreindre les uploads à une taille maximale (ex: 10MB)
- Valider les types MIME
- Restreindre la lecture et suppression aux admins uniquement
- Ajouter un rate limiting

## Test rapide

Pour tester que le Storage fonctionne, uploadez manuellement un fichier test :
1. Allez dans Storage > submissions
2. Cliquez sur **Upload file**
3. Sélectionnez un PDF
4. Vérifiez que l'upload réussit

✅ Si tout fonctionne, passez à l'étape suivante : mise à jour du code !
