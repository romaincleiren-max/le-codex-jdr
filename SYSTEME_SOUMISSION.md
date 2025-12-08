# 📥 Système de Soumission - Mode d'Emploi

## ✅ OUI ! Le système de soumission est DÉJÀ FONCTIONNEL

Votre application possède déjà un système complet de soumission de scénarios par le public.

---

## 🔄 Workflow Complet

### 1️⃣ L'utilisateur soumet un scénario (Page publique)

**Où ?** Page `/submit` - Onglet "Proposer" dans la navigation

**Formulaire accessible à tous :**
- ✅ Nom du scénario
- ✅ Nom de l'auteur
- ✅ Email de contact
- ✅ Résumé du scénario
- ✅ **Upload du fichier PDF** (validation : seuls les .pdf acceptés)

**Quand il clique "Soumettre" :**
```javascript
1. Le PDF est uploadé vers Supabase Storage (bucket "submissions")
2. Une entrée est créée dans la table "submissions" avec :
   - scenario_name
   - author
   - email
   - summary
   - pdf_filename
   - pdf_url (lien Supabase)
   - status: "pending" (en attente)
   - created_at (date/heure)
3. Message de confirmation affiché
```

### 2️⃣ Vous gérez les soumissions (Admin)

**Où ?** Page `/admin` > Onglet **📥 Soumissions**

**Vous voyez :**
- ✅ Liste de toutes les soumissions reçues
- ✅ Badge de statut : 
  - ⏳ En attente (pending)
  - ✅ Approuvé (approved)
  - ❌ Rejeté (rejected)
- ✅ Toutes les informations :
  - Nom du scénario
  - Auteur
  - Email
  - Résumé
  - Nom du fichier PDF
  - Date de soumission

**Actions disponibles :**
- 📥 **Télécharger PDF** - Récupère le fichier pour l'examiner
- 📧 **Répondre** - Ouvre votre client email avec l'adresse pré-remplie
- ✅ **Approuver** - Change le statut en "approuvé"
- ❌ **Rejeter** - Change le statut en "rejeté"
- 🗑️ **Supprimer** - Supprime la soumission ET le PDF de Supabase

### 3️⃣ Vous décidez d'uploader ou non

**Si le scénario est bon :**
1. Téléchargez le PDF
2. Allez dans l'onglet **📖 Scénarios**
3. Créez un nouveau scénario avec les infos de la soumission
4. Uploadez les images (via Imgur ou autre)
5. Publiez !
6. Répondez par email à l'auteur pour lui confirmer

**Si le scénario n'est pas retenu :**
1. Cliquez sur "❌ Rejeter"
2. Répondez par email pour expliquer poliment
3. Optionnel : Supprimez la soumission

---

## 🛠️ Configuration Requise

Le code est **déjà implémenté** dans votre app ! Il faut juste configurer Supabase :

### Étape 1 : Créer le bucket "submissions"

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Storage** (menu gauche) > **New bucket**
4. Configurez :
   - **Name** : `submissions`
   - **Public bucket** : ❌ **DÉCOCHÉ** (privé pour sécurité)
   - Cliquez **Create bucket**

### Étape 2 : Configurer les politiques RLS

Le bucket doit être privé, mais autoriser l'upload public (pour les soumissions).

**Option A : Via l'interface (plus simple)**

1. Cliquez sur le bucket `submissions`
2. Onglet **Policies**
3. **New Policy** pour chaque opération :

**Politique 1 - Upload public :**
- Name: `Public upload for submissions`
- Policy: `true`
- Allowed operation: ✅ INSERT
- Target roles: `public`

**Politique 2 - Lecture restreinte :**
- Name: `Admin read only`
- Policy: `false`
- Allowed operation: ✅ SELECT
- Target roles: `authenticated`, `public`

> Note : Seul le service role (backend) pourra lire les fichiers

**Politique 3 - Suppression admin :**
- Name: `Admin delete only`
- Policy: `false`
- Allowed operation: ✅ DELETE
- Target roles: `authenticated`, `public`

**Option B : Via SQL Editor**

```sql
-- Permettre l'upload public (pour les soumissions)
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Public upload for submissions',
  'submissions',
  'true',
  ARRAY['INSERT'],
  ARRAY['public']
);

-- Bloquer la lecture publique (seul service role peut lire)
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Admin read only',
  'submissions',
  'false',
  ARRAY['SELECT'],
  ARRAY['authenticated', 'public']
);

-- Bloquer la suppression publique
INSERT INTO storage.policies (name, bucket_id, definition, allowed_operations, target_roles)
VALUES (
  'Admin delete only',
  'submissions',
  'false',
  ARRAY['DELETE'],
  ARRAY['authenticated', 'public']
);
```

### Étape 3 : Vérifier que la table existe

La table `submissions` devrait déjà exister (créée via `schema.sql`).

Vérifiez dans **Table Editor** > `submissions`

Si elle n'existe pas, elle a déjà été créée par le schéma initial.

---

## 🔒 Sécurité

✅ **Ce qui est sécurisé :**
- Les PDFs sont dans un bucket PRIVÉ (pas d'URL publique)
- Seul l'admin peut télécharger les PDFs (via service role)
- Validation côté client : seuls les PDFs acceptés
- RLS activé sur la table `submissions`

✅ **Workflow sécurisé :**
1. Utilisateur upload → PDF va dans Storage privé
2. Admin clique "Télécharger" → Génère URL signée temporaire (5 min)
3. Admin télécharge le fichier
4. URL expire automatiquement

---

## 📊 Statistiques de soumissions

Dans l'onglet **📥 Soumissions**, vous voyez :
- Nombre total de soumissions
- Statut de chaque soumission
- Filtrage possible par statut
- Tri par date

---

## 💡 Cas d'usage

### Scénario 1 : Soumission reçue
```
1. Jean soumet son scénario "La Crypte Maudite" avec PDF
2. Vous voyez la soumission dans Admin > Soumissions
3. Vous téléchargez le PDF pour le lire
4. Vous l'adorez !
5. Vous créez un nouveau scénario dans Admin > Scénarios
6. Vous uploadez les images sur Imgur
7. Vous publiez
8. Vous répondez à Jean pour le remercier
9. Vous approuvez sa soumission (badge ✅)
```

### Scénario 2 : Soumission non retenue
```
1. Marie soumet son scénario
2. Vous le téléchargez et le lisez
3. Ce n'est pas adapté à votre collection
4. Vous cliquez "Rejeter" (badge ❌)
5. Vous lui répondez poliment par email
6. Plus tard, vous supprimez la soumission
```

---

## 🎯 Checklist de mise en place

- [ ] Créer le bucket `submissions` (privé)
- [ ] Configurer les 3 politiques RLS
- [ ] Tester : aller sur /submit et soumettre un test
- [ ] Vérifier dans Admin > Soumissions
- [ ] Télécharger le PDF test
- [ ] Tester les boutons Approuver/Rejeter/Supprimer

---

## 🚀 Le système est prêt !

**Tout est déjà implémenté dans votre code :**
- ✅ Page de soumission publique
- ✅ Upload vers Supabase
- ✅ Interface admin complète
- ✅ Téléchargement sécurisé
- ✅ Gestion des statuts
- ✅ Suppression (fichier + entrée DB)

**Il suffit de configurer le bucket Supabase et c'est opérationnel !**

---

## 🆘 Dépannage

### "Erreur lors de l'upload"
➡️ Vérifiez que le bucket `submissions` existe et est configuré

### "Impossible de télécharger le PDF"
➡️ Vérifiez que vous avez la `SUPABASE_SERVICE_ROLE_KEY` dans `.env`

### "Aucune soumission affichée"
➡️ Vérifiez les politiques RLS de la table `submissions`

---

**🎉 Votre système de soumission communautaire est prêt à recevoir des scénarios du monde entier !**
