# 🚀 Guide de Migration - localStorage → Supabase + Stripe

## ✅ Ce qui a été fait

### 1. Configuration Supabase ✅
- ✅ Projet Supabase créé
- ✅ Fichiers `.env` et `.env.example` créés
- ✅ Client Supabase configuré (`src/lib/supabase.js`)
- ✅ Schéma SQL exécuté (6 tables créées)
- ✅ Services Supabase créés (`src/services/supabaseService.js`)
- ✅ Hook React créé (`src/hooks/useSupabaseData.js`)

### 2. Structure de la base de données ✅
- `themes` - Thèmes (Médiéval, Lovecraft, Sci-Fi)
- `campaigns` - Campagnes/Sagas
- `scenarios` - Scénarios individuels
- `site_settings` - Paramètres du site
- `orders` - Commandes clients
- `order_items` - Détails des commandes

---

## 📋 État actuel du projet

### ⚠️ Le site fonctionne encore avec localStorage

**Le code actuel utilise toujours localStorage**, ce qui est parfait pour une **migration progressive** et éviter de tout casser !

### 🎯 Stratégie de migration (2 approches possibles)

---

## Option A : Migration Progressive (Recommandé) 🟢

**Avantages** : Sécurisé, testable étape par étape, rollback facile

### Étape 1 : Tester Supabase (sans modifier le site actuel)

1. **Créer une page de test** :
   ```bash
   # Créer src/pages/TestSupabase.jsx
   ```

2. **Tester le chargement des données** :
   - Importer `useSupabaseData`
   - Vérifier que les 3 thèmes se chargent
   - Vérifier que la connexion fonctionne

3. **Si ça marche**, passer à l'étape 2

### Étape 2 : Migrer les données localStorage → Supabase

**Script de migration** : Copier les données actuelles vers Supabase

```javascript
// À exécuter UNE SEULE FOIS dans la console du navigateur
// Ou créer un bouton "Migrer vers Supabase" dans l'admin
```

### Étape 3 : Basculer l'application vers Supabase

**Modifier le code principal** pour utiliser le hook `useSupabaseData` au lieu de localStorage.

### Étape 4 : Intégrer Stripe

Une fois Supabase fonctionnel, ajouter les paiements Stripe.

---

## Option B : Migration Complète d'un Coup 🔴

**Avantages** : Plus rapide  
**Inconvénients** : Risqué, si ça casse, tout casse

Je **déconseille** cette approche pour un site en production.

---

## 🎯 Prochaines étapes recommandées

### 1️⃣ Tester la connexion Supabase (5 min)

Je peux créer une page de test pour vérifier que tout fonctionne.

**Commande** :
```
Cline, crée une page de test Supabase
```

### 2️⃣ Migrer les données existantes (10 min)

Si tu as déjà des campagnes dans localStorage, je crée un script pour les copier vers Supabase.

**Commande** :
```
Cline, crée un script de migration localStorage → Supabase
```

### 3️⃣ Basculer l'application vers Supabase (30 min)

Modifier `main.jsx` pour utiliser le hook `useSupabaseData`.

**Commande** :
```
Cline, bascule l'application vers Supabase
```

### 4️⃣ Configurer Stripe (après que Supabase fonctionne)

Une fois que l'app utilise Supabase, on pourra ajouter les vrais paiements.

---

## 🔍 Comparaison : Avant / Après

### Avant (localStorage)
```javascript
// Dans App.jsx
const [sagas, setSagas] = useState(() => {
  const saved = localStorage.getItem('le-codex-sagas');
  return saved ? JSON.parse(saved) : [];
});
```

### Après (Supabase)
```javascript
// Dans App.jsx
import { useSupabaseData } from './hooks/useSupabaseData';

const { campaigns, loading, error } = useSupabaseData();
```

**Changements** :
- ✅ Données centralisées (un seul endroit)
- ✅ Tous les utilisateurs voient les mêmes campagnes
- ✅ Backup automatique
- ✅ Préparé pour paiements Stripe
- ✅ Possibilité d'authentification future

---

## ⚠️ Points d'attention

### 1. Gestion des erreurs
Le hook `useSupabaseData` a un **fallback vers localStorage** si Supabase ne répond pas.

### 2. Variables d'environnement
Le fichier `.env` contient tes clés Supabase. **NE JAMAIS LE COMMIT !** ✅ Déjà dans `.gitignore`

### 3. Données actuelles
Si tu as des campagnes dans localStorage, il faut les migrer **avant** de basculer.

### 4. Cache navigateur
Après migration, les utilisateurs devront peut-être rafraîchir (Ctrl+F5).

---

## 🚀 Ce que je te propose maintenant

**Je te recommande** :

1. **D'abord tester** que Supabase fonctionne avec une page de test
2. **Ensuite migrer** les données si tu en as
3. **Puis basculer** l'application
4. **Enfin configurer** Stripe

**Quelle étape veux-tu faire en premier ?**

---

## 📞 Commandes disponibles

```bash
# Créer une page de test Supabase
Cline, crée une page de test Supabase

# Migrer les données localStorage vers Supabase
Cline, crée un script de migration

# Basculer l'application vers Supabase
Cline, bascule vers Supabase

# Configurer Stripe (après Supabase)
Cline, configure Stripe
```

---

## 🆘 En cas de problème

### Erreur "Failed to fetch"
➡️ Vérifie que les clés dans `.env` sont correctes

### Erreur "Row Level Security"
➡️ Les politiques RLS sont configurées dans le schéma SQL

### Données ne s'affichent pas
➡️ Vérifie dans Supabase > Table Editor que les tables contiennent des données

### Site ne se lance plus
➡️ Regarde la console (F12) pour voir l'erreur exacte

---

## 📝 Notes importantes

- **Backup** : Tes données localStorage sont toujours là en cas de rollback
- **Déploiement** : Vercel/Netlify devront avoir les variables d'env configurées
- **Stripe** : On l'ajoutera APRÈS que Supabase fonctionne
- **Paiements** : Stripe sera en mode TEST d'abord (pas d'argent réel)

---

## 🎯 Qu'est-ce qu'on fait maintenant ?

**Dis-moi** :
1. Veux-tu créer une page de test d'abord ?
2. Veux-tu basculer directement vers Supabase ?
3. Veux-tu que je t'explique plus en détail une étape ?

**Je suis prêt pour la suite !** 🚀
