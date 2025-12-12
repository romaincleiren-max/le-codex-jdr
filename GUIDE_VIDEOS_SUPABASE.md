# 🎬 Guide d'utilisation des Vidéos avec Supabase Storage

## 📋 Étape 1 : Créer le bucket "videos" dans Supabase

1. **Connectez-vous** à [supabase.com](https://supabase.com)
2. **Sélectionnez** votre projet Le Codex
3. **Cliquez** sur **"Storage"** dans le menu latéral gauche
4. **Cliquez** sur le bouton **"New Bucket"**
5. **Configurez** le bucket avec ces paramètres :

```
Name: videos
Public bucket: ✅ COCHER (important pour que les vidéos soient accessibles)
File size limit: 100 MB (ou plus selon vos besoins)
Allowed MIME types: video/mp4, video/webm, video/ogg
```

6. **Cliquez** sur **"Create bucket"**

---

## 🔒 Étape 2 : Configurer les permissions (RLS)

Par défaut, le bucket est créé avec des règles de sécurité. Ajustez-les :

1. **Dans Storage**, cliquez sur votre bucket **"videos"**
2. **Cliquez** sur l'onglet **"Policies"**
3. **Créez ces 2 politiques** :

### Politique 1 : Lecture publique (tout le monde peut voir)
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );
```

### Politique 2 : Upload admin uniquement
```sql
CREATE POLICY "Admin can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email IN (
      SELECT email FROM admin_users
    )
  )
);
```

---

## 💻 Étape 3 : Utiliser l'interface d'administration

### Option A : Upload manuel via Supabase Dashboard

1. **Allez dans Storage → videos**
2. **Créez** un dossier `backgrounds/` (recommandé pour organiser)
3. **Cliquez** sur **"Upload file"**
4. **Sélectionnez** votre vidéo MP4
5. **Copiez l'URL publique** générée

**URL finale :** 
```
https://votreprojet.supabase.co/storage/v1/object/public/videos/backgrounds/ma-video.mp4
```

### Option B : Upload via code (À VENIR - interface admin)

```javascript
import { supabaseService } from './services/supabaseService';

// Upload une vidéo
const file = document.getElementById('videoInput').files[0];
const result = await supabaseService.uploadVideo(file, 'backgrounds');
console.log('URL de la vidéo:', result.url);
```

---

## 🎯 Étape 4 : Utiliser la vidéo dans une campagne

1. **Allez dans Admin → Campagnes**
2. **Créez ou modifiez** une campagne
3. Dans le champ **"🎬 Vidéo d'arrière-plan"**, collez l'URL Supabase :

```
https://votreprojet.supabase.co/storage/v1/object/public/videos/backgrounds/ma-video.mp4
```

4. **Sauvegardez** la campagne

✨ **La vidéo s'affiche maintenant en arrière-plan !**

---

## 📊 Exemples d'URLs

### Vidéo hébergée sur Supabase
```
https://xyzabc123.supabase.co/storage/v1/object/public/videos/backgrounds/medieval-fog.mp4
```

### Vidéo hébergée ailleurs (aussi supporté)
```
https://example.com/videos/my-video.mp4
```

### Vidéo locale (pour développement)
```
/videos/test-video.mp4
```

---

## 🔧 Fonctions disponibles dans le code

```javascript
// Upload une vidéo
const result = await supabaseService.uploadVideo(videoFile, 'backgrounds');
// result = { path, url, fileName }

// Lister toutes les vidéos
const videos = await supabaseService.listVideos('backgrounds');
// videos = [{name, url, size, created_at}, ...]

// Supprimer une vidéo
await supabaseService.deleteVideo('backgrounds/1234567890-abc.mp4');
```

---

## 📐 Recommandations techniques

### Formats vidéo supportés
- ✅ **MP4** (H.264) - **RECOMMANDÉ** (meilleure compatibilité)
- ✅ WebM (VP8/VP9)
- ✅ OGG (Theora)

### Compression recommandée
```bash
# Utiliser FFmpeg pour optimiser
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k output.mp4
```

**Paramètres suggérés :**
- Résolution : **1920x1080** (Full HD)
- Bitrate vidéo : **2-4 Mbps**
- Codec : **H.264**
- FPS : **24-30 fps**
- Durée : **10-30 secondes** (en boucle)

### Taille de fichier
- ⚠️ Maximum **100 MB** par défaut
- 💡 Objectif idéal : **10-30 MB**
- 🎯 Plus c'est léger, plus c'est rapide à charger

---

## 🎨 Effets appliqués automatiquement

Votre vidéo sera affichée avec :
- **Lecture automatique** en boucle
- **Sans son** (muted)
- **Flou léger** (blur 2px)
- **Assombrissement** (brightness 0.4)
- **Overlay gradient** pour la lisibilité

---

## 🐛 Dépannage

### La vidéo ne se charge pas ?

1. **Vérifiez l'URL** : elle doit être publique
2. **Vérifiez le bucket** : il doit être "Public"
3. **Vérifiez les permissions RLS** (voir Étape 2)
4. **Testez l'URL** directement dans le navigateur

### La vidéo est trop lente ?

1. **Compressez** la vidéo (voir Compression)
2. **Réduisez** la résolution à 1280x720
3. **Baissez** le bitrate à 1-2 Mbps
4. **Raccourcissez** la durée (10-15 secondes suffisent)

### Erreur "bucket not found" ?

Le bucket "videos" n'existe pas encore. Retournez à l'Étape 1.

---

## 💡 Astuces Pro

### Organiser vos vidéos
```
videos/
├── backgrounds/
│   ├── medieval-fog.mp4
│   ├── lovecraft-tentacles.mp4
│   └── scifi-stars.mp4
├── animations/
│   └── intro.mp4
└── effects/
    └── particles.mp4
```

### Créer des vidéos optimisées
- Utilisez des **boucles parfaites** (seamless loops)
- Privilégiez les **mouvements lents**
- Évitez les **couleurs trop vives** (perturbent la lecture)
- Testez sur **mobile** (connexion lente)

### Alternatives gratuites pour créer des vidéos
- [Pexels Videos](https://www.pexels.com/videos/) - Vidéos gratuites
- [Pixabay Videos](https://pixabay.com/videos/) - Vidéos libres de droits
- [Mixkit](https://mixkit.co/free-stock-video/) - Vidéos HD gratuites

---

## 📝 Checklist finale

- [ ] Bucket "videos" créé dans Supabase
- [ ] Bucket configuré en "Public"
- [ ] Permissions RLS configurées
- [ ] Vidéo uploadée dans `backgrounds/`
- [ ] URL copiée depuis Supabase
- [ ] URL ajoutée dans Admin → Campagnes
- [ ] Vidéo testée en navigation
- [ ] Vidéo optimisée (< 30 MB)

---

## 🎉 C'est terminé !

Votre système de vidéos avec Supabase Storage est opérationnel ! 

Les vidéos sont maintenant :
- ✅ Hébergées de manière sécurisée
- ✅ Chargées rapidement via CDN
- ✅ Accessibles publiquement
- ✅ Gérées facilement

**Questions ?** Consultez la [documentation Supabase Storage](https://supabase.com/docs/guides/storage)
