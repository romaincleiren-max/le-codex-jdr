# 🔧 Correction du Système de Statistiques (Analytics)

## 📋 Problème Identifié

Les statistiques ne s'affichaient pas dans le panneau d'administration pour plusieurs raisons :

### 1. **Problèmes de Permissions RLS (Row Level Security)**
- Les politiques RLS sur la table `analytics_events` empêchaient l'accès aux vues d'analytics
- Les vues (`analytics_realtime`, `analytics_by_theme`, etc.) n'avaient pas les permissions GRANT nécessaires
- La syntaxe de récupération de l'email utilisateur dans les politiques RLS était incorrecte

### 2. **Problèmes dans les Vues SQL**
- La vue `analytics_top_scenarios` retournait des résultats même pour les scénarios sans vues
- Absence de gestion des valeurs NULL dans certaines vues
- Les filtres de dates n'étaient pas toujours appliqués correctement

### 3. **Absence de Données**
- Si aucun événement n'a été tracké, les statistiques restent à zéro
- Pas de données de démonstration pour tester le système

## ✅ Solution Appliquée

### Fichiers Créés

1. **`supabase/FIX_ANALYTICS_RLS.sql`** - Script de correction principal
   - Corrige toutes les politiques RLS
   - Recrée les vues avec les bonnes permissions
   - Ajoute une fonction de diagnostic `check_analytics_access()`

2. **`supabase/TEST_ANALYTICS_DATA.sql`** - Script de test
   - Insère des données de démonstration
   - Permet de tester immédiatement le système
   - Génère des statistiques visibles

## 🚀 Instructions de Correction

### Étape 1 : Exécuter le Script de Correction

1. Connectez-vous à votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (éditeur SQL)
4. Copiez et collez le contenu de `supabase/FIX_ANALYTICS_RLS.sql`
5. Cliquez sur **Run** pour exécuter le script

### Étape 2 : Vérifier les Permissions

Exécutez cette requête dans l'éditeur SQL pour vérifier vos permissions :

```sql
SELECT * FROM check_analytics_access();
```

Vous devriez voir :
- `has_insert_on_events`: `true` (tout le monde peut insérer)
- `has_select_on_events`: `true` (si vous êtes admin authentifié)
- `has_select_on_realtime`: `true` (si vous êtes admin authentifié)
- `is_admin`: `true` (si votre email est dans admin_users)
- `current_user_email`: votre email

### Étape 3 : Ajouter des Données de Test (Optionnel)

Pour voir immédiatement des statistiques :

1. Dans l'éditeur SQL de Supabase
2. Copiez et collez le contenu de `supabase/TEST_ANALYTICS_DATA.sql`
3. Cliquez sur **Run**

Cela créera des événements de test pour les dernières 24h.

### Étape 4 : Vérifier l'Application

1. Connectez-vous à votre panneau d'administration
2. Accédez à la page des statistiques
3. Cliquez sur le bouton **🔄 Actualiser les statistiques**
4. Les statistiques devraient maintenant s'afficher

## 🔍 Diagnostic des Problèmes

### Si les statistiques ne s'affichent toujours pas :

#### 1. Vérifiez la Console du Navigateur
Ouvrez les DevTools (F12) et regardez la console pour des erreurs :
- Erreurs Supabase → problème de permissions
- Erreurs réseau → problème de connexion
- Erreurs JavaScript → problème dans le code frontend

#### 2. Vérifiez les Permissions dans Supabase
```sql
-- Vérifier que vous êtes bien admin
SELECT * FROM admin_users WHERE email = '[votre-email]';

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'analytics_events';

-- Tester l'accès aux vues
SELECT * FROM analytics_realtime;
SELECT * FROM analytics_by_theme;
```

#### 3. Vérifiez qu'il y a des Données
```sql
-- Compter les événements des dernières 24h
SELECT COUNT(*) FROM analytics_events 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Voir les types d'événements
SELECT event_type, COUNT(*) 
FROM analytics_events 
GROUP BY event_type;
```

#### 4. Vérifiez l'Authentification
- Assurez-vous d'être connecté en tant qu'administrateur
- Vérifiez que votre token JWT est valide
- Essayez de vous déconnecter/reconnecter

## 📊 Structure du Système Analytics

### Tables Principales

1. **`analytics_events`** - Stocke tous les événements
   - Événements tracés : page_view, scenario_view, download, cart_add, purchase
   - Chaque événement inclut : type, catégorie, label, valeur, IDs liés, session

2. **`analytics_daily_stats`** - Statistiques agrégées quotidiennes (future utilisation)

### Vues Disponibles

1. **`analytics_realtime`** - Stats des dernières 24h
   - Visites totales, sessions uniques, téléchargements, etc.

2. **`analytics_by_theme`** - Répartition par thème (medieval, lovecraft, scifi)
   - Vues totales et visiteurs uniques par thème

3. **`analytics_top_scenarios`** - Top 10 des scénarios populaires
   - Vues uniques, téléchargements, ajouts au panier

4. **`analytics_peak_hours`** - Heures de pointe de la semaine
   - Nombre d'événements par heure

### Politiques RLS

1. **Public peut insérer** - Permet le tracking anonyme
2. **Admins peuvent lire** - Seuls les admins voient les stats
3. **Protection des vues** - GRANT SELECT aux utilisateurs authentifiés

## 🎯 Tracking des Événements

Le système track automatiquement :

- ✅ **Page Views** - Chaque visite de page
- ✅ **Scenario Views** - Consultation d'un scénario
- ✅ **Downloads** - Téléchargements de fichiers
- ✅ **Cart Adds** - Ajouts au panier
- ✅ **Purchases** - Achats complétés

### Comment Tracker un Événement (Code)

```javascript
import analyticsService from './services/analyticsService';

// Tracker une visite de page
analyticsService.trackPageView('home', 'navigation');

// Tracker la vue d'un scénario
analyticsService.trackScenarioView(scenario, campaign);

// Tracker un téléchargement
analyticsService.trackDownload(scenario, 'scenario');

// Tracker un ajout au panier
analyticsService.trackAddToCart(item, 'scenario');
```

## 🔐 Sécurité

- ✅ RLS activé sur toutes les tables
- ✅ Insertion publique (anonyme) pour le tracking
- ✅ Lecture limitée aux administrateurs authentifiés
- ✅ Pas d'exposition d'informations sensibles
- ✅ Sessions anonymes (pas de données personnelles)

## 🧪 Tests de Validation

Pour valider que tout fonctionne :

```sql
-- 1. Insérer un événement de test
INSERT INTO analytics_events (event_type, event_category, event_label, session_id)
VALUES ('page_view', 'home', 'Test', 'test_session_123');

-- 2. Vérifier qu'il apparaît dans les vues
SELECT * FROM analytics_realtime;

-- 3. Vérifier les permissions
SELECT * FROM check_analytics_access();

-- 4. Compter les événements
SELECT COUNT(*) FROM analytics_events;
```

## 📈 Améliorations Futures

- [ ] Agrégation quotidienne automatique (cronjob)
- [ ] Graphiques de tendances
- [ ] Export CSV des statistiques
- [ ] Filtres par période personnalisée
- [ ] Géolocalisation des visiteurs
- [ ] Analyse de conversion (funnel)
- [ ] Statistiques temps réel avec WebSockets

## 🆘 Support

Si vous rencontrez toujours des problèmes :

1. Vérifiez les logs Supabase (Dashboard → Logs)
2. Consultez la console JavaScript (F12)
3. Exécutez `check_analytics_access()` dans SQL Editor
4. Vérifiez que votre email est dans la table `admin_users`

---

**Date de création** : 16 décembre 2024  
**Dernière mise à jour** : 16 décembre 2024  
**Version** : 1.0
