# 💰 Guide Complet - Système de Vente de PDFs

## 📋 Vue d'ensemble

Ce système permet de vendre des PDFs (campagnes/scénarios) avec :
- ✅ Upload sécurisé vers Supabase Storage (bucket privé)
- ✅ Paiement via Stripe
- ✅ Téléchargement sécurisé avec tokens temporaires
- ✅ Limite de téléchargements (3x max)
- ✅ Expiration des liens (48h payant, 24h gratuit)

---

## 🗂️ Fichiers créés

### 1. Schéma de base de données
- **`supabase/PDF_SALES_SCHEMA.sql`** - Tables `products` et `purchases` + fonctions

### 2. Configuration Storage
- **`supabase/PDF_STORAGE_SETUP.md`** - Configuration du bucket privé "pdfs"

### 3. À créer (prochaines étapes)
- Services d'upload/download de PDFs
- Page admin de gestion des produits
- Page publique des produits
- Intégration Stripe
- Système de téléchargement avec tokens

---

## 🚀 Étapes de mise en place

### Phase 1 : Configuration Supabase (30 minutes)

#### A. Exécuter le schéma SQL

1. Ouvrez votre dashboard Supabase
2. SQL Editor > New query
3. Copiez le contenu de `supabase/PDF_SALES_SCHEMA.sql`
4. Exécutez (Run)
5. Vérifiez que les tables `products` et `purchases` sont créées

#### B. Créer le bucket pdfs

Suivez `supabase/PDF_STORAGE_SETUP.md` :

1. Storage > New bucket > Nom: `pdfs` > ❌ Pas public
2. Configurez les 3 politiques (tout à `false`)
3. Récupérez votre **Service Role Key** (Settings > API)
4. Ajoutez-la dans `.env` :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
   ```

### Phase 2 : Installation Stripe (15 minutes)

#### A. Créer un compte Stripe

1. Allez sur https://stripe.com
2. Créez un compte (mode test suffit pour commencer)
3. Dashboard > Developers > API keys
4. Copiez :
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)

#### B. Installer Stripe dans le projet

```bash
npm install @stripe/stripe-js stripe
```

#### C. Configuration .env

Ajoutez dans `.env` :

```env
# Stripe Keys (MODE TEST)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

**⚠️ Important** : 
- `VITE_STRIPE_PUBLISHABLE_KEY` peut être exposée côté client
- `STRIPE_SECRET_KEY` doit rester secrète (backend only)

### Phase 3 : Développement Backend (API Routes)

**Problème** : Votre projet est en React pur (Vite). Stripe nécessite un backend pour :
- Créer les sessions de paiement
- Recevoir les webhooks
- Uploader les PDFs avec service role

**Solutions** :

#### Option 1 : Créer des API Routes avec Vercel Serverless Functions

Créez `api/` à la racine :

```
le-codex/
  api/
    create-checkout.js    # Créer session Stripe
    webhook.js            # Recevoir webhooks Stripe
    upload-pdf.js         # Upload PDF avec service role
    download.js           # Générer URL signée
```

#### Option 2 : Migrer vers Next.js (recommandé long terme)

Next.js offre API routes intégrées.

#### Option 3 : Backend séparé (Node.js/Express)

Créer un serveur séparé qui gère les paiements.

### Phase 4 : Créer les composants Frontend

#### A. Page Admin - Gestion des produits

Créer `src/pages/AdminProducts.jsx` :
- Formulaire d'ajout de produit
- Upload de PDF
- Liste des produits
- Modification/suppression

#### B. Page Publique - Boutique

Créer `src/pages/Shop.jsx` :
- Affichage de tous les produits
- Bouton "Télécharger" (gratuit) ou "Acheter" (payant)
- Filtres par type/prix

#### C. Page de téléchargement

Créer `src/pages/Download.jsx` :
- Vérifier le token
- Afficher info produit
- Générer URL signée
- Télécharger le PDF

---

## 📐 Architecture du système

```
┌─────────────────────────────────────────────────────────────┐
│                        WORKFLOW COMPLET                      │
└─────────────────────────────────────────────────────────────┘

1. ADMIN UPLOADE UN PRODUIT
   ┌─────────────┐
   │   Admin UI  │──> Upload PDF + Infos
   └──────┬──────┘
          │
          v
   ┌─────────────────────┐
   │ API: /upload-pdf    │──> Service Role Key
   └──────┬──────────────┘
          │
          v
   ┌─────────────────────────┐
   │ Supabase Storage (pdfs) │──> Fichier stocké
   └──────┬──────────────────┘
          │
          v
   ┌────────────────────┐
   │ Table: products    │──> Entrée créée
   └────────────────────┘

2. CLIENT ACHÈTE UN PRODUIT PAYANT
   ┌──────────────┐
   │  Shop Page   │──> Clic "Acheter"
   └──────┬───────┘
          │
          v
   ┌───────────────────────────┐
   │ API: /create-checkout     │──> Crée Stripe Session
   └──────┬────────────────────┘
          │
          v
   ┌─────────────────┐
   │ Stripe Checkout │──> Paiement
   └──────┬──────────┘
          │
          v (si succès)
   ┌──────────────────┐
   │ Webhook Stripe   │──> checkout.session.completed
   └──────┬───────────┘
          │
          v
   ┌─────────────────────┐
   │ Table: purchases    │──> Token créé, expires_at = +48h
   └──────┬──────────────┘
          │
          v
   ┌───────────────────┐
   │ Email au client   │──> Lien avec token
   └───────────────────┘

3. CLIENT TÉLÉCHARGE LE PDF
   ┌──────────────────────┐
   │ Clic sur lien email  │──> /download/:token
   └──────┬───────────────┘
          │
          v
   ┌─────────────────────────────┐
   │ Vérifier token (SQL function)│──> Valid? Expiré? Quota?
   └──────┬──────────────────────┘
          │ (si OK)
          v
   ┌──────────────────────────────────┐
   │ Générer URL signée (5 min)       │──> Service Role
   └──────┬───────────────────────────┘
          │
          v
   ┌─────────────────────┐
   │ Incrémenter compteur│──> download_count++
   └──────┬──────────────┘
          │
          v
   ┌──────────────────────┐
   │ Redirection vers PDF │──> Téléchargement
   └──────────────────────┘
```

---

## 🔐 Sécurité - Points clés

### 1. PDFs jamais accessibles publiquement
- ✅ Bucket en mode PRIVÉ
- ✅ URLs signées temporaires (5 min)
- ✅ Vérification de token avant chaque download

### 2. Clés sensibles
- ❌ `SUPABASE_SERVICE_ROLE_KEY` → Jamais côté client
- ❌ `STRIPE_SECRET_KEY` → Jamais côté client
- ✅ Utilisez uniquement dans API routes (backend)

### 3. Tokens de téléchargement
- ✅ Générés avec `gen_random_bytes(32)` (cryptographique)
- ✅ Uniques (contrainte SQL)
- ✅ Expiration forcée
- ✅ Limite de téléchargements

### 4. Webhooks Stripe
- ✅ Vérifier la signature Stripe
- ✅ Valider l'événement
- ✅ Idempotence (ne pas créer 2x le même purchase)

---

## 💡 Prochaines étapes recommandées

### Étape 1 : Configuration Supabase ⏰ 30 min
- [ ] Exécuter `PDF_SALES_SCHEMA.sql`
- [ ] Créer bucket `pdfs` (privé)
- [ ] Ajouter Service Role Key dans `.env`

### Étape 2 : Backend API Routes ⏰ 4-6h
- [ ] Créer `/api/upload-pdf.js`
- [ ] Créer `/api/create-checkout.js`
- [ ] Créer `/api/webhook.js`
- [ ] Créer `/api/download/:token.js`

### Étape 3 : Frontend Admin ⏰ 3-4h
- [ ] Page gestion produits
- [ ] Formulaire upload PDF
- [ ] Liste produits + édition

### Étape 4 : Frontend Public ⏰ 2-3h
- [ ] Page boutique
- [ ] Integration paiement Stripe
- [ ] Page de téléchargement

### Étape 5 : Tests ⏰ 2-3h
- [ ] Test upload PDF
- [ ] Test paiement Stripe (mode test)
- [ ] Test téléchargement avec token
- [ ] Test expiration/limites

### Étape 6 : Production ⏰ 1-2h
- [ ] Passer Stripe en mode live
- [ ] Configurer webhooks Stripe
- [ ] Tester en production
- [ ] Monitoring

**Total estimé** : 12-18 heures de développement

---

## 📚 Ressources utiles

### Documentation
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

### Exemples de code
Tous les exemples sont dans `supabase/PDF_STORAGE_SETUP.md`

---

## 🆘 Besoin d'aide ?

### Problème : "Permission denied" lors upload PDF
➡️ Vérifiez que vous utilisez `SUPABASE_SERVICE_ROLE_KEY`

### Problème : Webhook Stripe ne fonctionne pas
➡️ Installez Stripe CLI pour tester localement :
```bash
stripe listen --forward-to http://localhost:5173/api/webhook
```

### Problème : Token invalide lors du téléchargement
➡️ Vérifiez que le token est bien passé dans l'URL et que la fonction SQL est créée

---

## 🎯 Résumé

Vous avez maintenant :
- ✅ **Schéma SQL complet** pour products & purchases
- ✅ **Documentation** pour configurer Supabase Storage
- ✅ **Architecture** claire du système
- ✅ **Plan d'implémentation** étape par étape

**Prochaine action** : Exécutez `PDF_SALES_SCHEMA.sql` dans Supabase pour créer les tables !

---

**🚀 Bon développement !**
