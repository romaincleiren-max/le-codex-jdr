# 🧪 Guide de Test Stripe - Prêt à Tester !

## ✅ Votre système de paiement est PRÊT !

Vous avez modifié `main.jsx` avec le vrai code de paiement Stripe. Suivez ces étapes pour tester.

---

## 📝 ÉTAPE 1 : Configurer vos Clés Stripe

### 1.1 Créer un compte Stripe (si pas déjà fait)
- Allez sur https://stripe.com
- Créez un compte GRATUIT
- Activez le **MODE TEST** (switch en haut à droite du dashboard)

### 1.2 Récupérer vos clés de test
1. Connectez-vous à https://dashboard.stripe.com
2. Assurez-vous d'être en **MODE TEST** (toggle en haut à droite)
3. Allez dans **Developers** > **API keys**
4. Vous verrez :
   - **Publishable key** : `pk_test_51...`
   - **Secret key** : Cliquez sur "Reveal test key" → `sk_test_...`

### 1.3 Créer le fichier `.env`

Dans le dossier racine du projet (`le-codex`), créez un fichier nommé exactement `.env` :

```bash
# Supabase (vous avez déjà ces valeurs)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Stripe - MODE TEST
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_COLLEZ_VOTRE_CLE_PUBLIQUE_ICI
STRIPE_SECRET_KEY=sk_test_COLLEZ_VOTRE_CLE_SECRETE_ICI
```

⚠️ **IMPORTANT** : 
- Remplacez `pk_test_...` par votre vraie clé publique
- Remplacez `sk_test_...` par votre vraie clé secrète
- **NE COMMITTEZ JAMAIS** le fichier `.env` sur Git

---

## 🚀 ÉTAPE 2 : Démarrer le Serveur

```bash
# Arrêtez le serveur s'il tourne (Ctrl+C)
# Redémarrez-le pour charger les nouvelles variables
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5173`

---

## 🎯 ÉTAPE 3 : Tester le Paiement

### 3.1 Parcours Utilisateur

1. **Ouvrez votre navigateur** → `http://localhost:5173`

2. **Ajoutez des articles au panier** :
   - Naviguez dans les campagnes
   - Cliquez sur "Ajouter au panier" (articles payants)

3. **Allez au panier** :
   - Cliquez sur l'icône panier (en haut à droite)
   - Vérifiez vos articles

4. **Cliquez sur "Procéder au paiement"**

5. **Remplissez le formulaire** :
   - Prénom : `Test`
   - Nom : `Stripe`
   - Email : `test@example.com`
   - Confirmez l'email

6. **Cliquez sur "Payer X €"**

7. **🎉 Vous devriez être REDIRIGÉ vers Stripe Checkout !**

### 3.2 Sur la Page Stripe Checkout

Vous verrez une page de paiement Stripe officielle avec :
- Le montant total
- Les articles achetés
- Un formulaire de carte bancaire

---

## 💳 ÉTAPE 4 : Utiliser les Cartes de Test

### ✅ Carte qui RÉUSSIT (utilisez celle-ci pour tester)

**Numéro** : `4242 4242 4242 4242`  
**Date d'expiration** : N'importe quelle date future (ex: `12/25`)  
**CVC** : N'importe quels 3 chiffres (ex: `123`)  
**Code postal** : N'importe quoi (ex: `75001`)

### Autres Cartes de Test

| Numéro de carte | Résultat |
|----------------|----------|
| `4242 4242 4242 4242` | ✅ Paiement RÉUSSI |
| `4000 0025 0000 3155` | ✅ Réussi avec 3D Secure |
| `4000 0000 0000 0002` | ❌ Carte DÉCLINÉE |
| `4000 0000 0000 9995` | ❌ Fonds INSUFFISANTS |

---

## 🔍 ÉTAPE 5 : Vérifier le Paiement

### Dans votre navigateur
Après un paiement réussi, vous devriez être redirigé vers :
```
http://localhost:5173/?success=true&session_id=cs_test_...
```

### Dans le Dashboard Stripe
1. Allez sur https://dashboard.stripe.com
2. Assurez-vous d'être en **MODE TEST**
3. Cliquez sur **Payments** dans le menu
4. Vous devriez voir votre paiement de test ! 🎉

---

## ❓ Problèmes Courants

### ❌ Erreur "Stripe is not defined"
**Solution** : Vérifiez que `VITE_STRIPE_PUBLISHABLE_KEY` est bien dans `.env` et redémarrez le serveur

### ❌ Erreur "Invalid API Key"
**Solution** : 
- Vérifiez que vous utilisez les clés de **TEST** (commencent par `pk_test_` et `sk_test_`)
- Vérifiez qu'il n'y a pas d'espaces avant/après les clés dans `.env`

### ❌ Rien ne se passe après "Payer"
**Solution** : 
- Ouvrez la console du navigateur (F12)
- Regardez les erreurs éventuelles
- Vérifiez que le serveur dev tourne bien

### ❌ Erreur 404 sur `/api/create-checkout-session`
**Solution** : C'est normal en dev local. En production sur Vercel, ça fonctionnera automatiquement

---

## 🎉 Si tout fonctionne...

Vous devriez voir :

1. ✅ Redirection vers Stripe Checkout
2. ✅ Page de paiement Stripe sécurisée
3. ✅ Paiement accepté avec la carte test
4. ✅ Retour sur votre site avec `?success=true`
5. ✅ Paiement visible dans le Dashboard Stripe

---

## 📋 Checklist de Test

- [ ] Compte Stripe créé
- [ ] Mode TEST activé sur Stripe
- [ ] Clés récupérées (pk_test et sk_test)
- [ ] Fichier `.env` créé avec les bonnes clés
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Articles ajoutés au panier
- [ ] Formulaire rempli
- [ ] Redirection vers Stripe Checkout réussie
- [ ] Carte test utilisée : `4242 4242 4242 4242`
- [ ] Paiement réussi
- [ ] Paiement visible dans le Dashboard Stripe

---

## 🚀 Prochaines Étapes

Une fois que tout fonctionne en test :

1. **Webhooks** : Configurer les webhooks Stripe pour recevoir des notifications
2. **Production** : Passer en mode LIVE avec de vraies clés
3. **Emails** : Envoyer des emails de confirmation automatiques
4. **PDFs** : Donner accès automatique aux PDFs après paiement

---

## 🆘 Besoin d'Aide ?

**Console du navigateur (F12)** : Pour voir les erreurs JavaScript  
**Console du serveur** : Pour voir les erreurs côté serveur  
**Dashboard Stripe** : Pour voir les logs de paiement  

---

## 🎯 COMMENCEZ MAINTENANT !

1. Créez votre compte Stripe (gratuit)
2. Récupérez vos clés de test
3. Créez le fichier `.env`
4. Redémarrez le serveur
5. Testez avec la carte `4242 4242 4242 4242`

**C'est parti ! 🚀**
