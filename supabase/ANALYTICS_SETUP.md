# 📊 Installation du Système Analytics

Ce guide explique comment installer et configurer le système de statistiques réelles pour Le Codex.

## 🚀 Installation

### Étape 1 : Exécuter le schéma SQL

1. Connectez-vous à votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez tout le contenu du fichier `ANALYTICS_SCHEMA.sql`
5. Collez-le dans l'éditeur
6. Cliquez sur **Run** pour exécuter le script

### Étape 2 : Vérifier l'installation

Exécutez cette requête pour vérifier que tout est bien créé :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'analytics%';

-- Vérifier les vues
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'analytics%';
```

Vous devriez voir :
- **Tables :** `analytics_events`, `analytics_daily_stats`
- **Vues :** `analytics_realtime`, `analytics_by_theme`, `analytics_top_scenarios`, `analytics_peak_hours`

### Étape 3 : Tester l'insertion d'événements

Testez en insérant un événement manuellement :

```sql
INSERT INTO analytics_events (
    event_type,
    event_category,
    event_label,
    session_id,
    user_agent
) VALUES (
    'page_view',
    'home',
    'Test event',
    'test_session_123',
    'Test User Agent'
);

-- Vérifier que l'événement a été inséré
SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 5;
```

### Étape 4 : Vérifier les permissions RLS

Les politiques de sécurité doivent permettre :
- ✅ **Insertion publique** : N'importe qui peut insérer des événements (tracking)
- ✅ **Lecture admin** : Seuls les admins peuvent lire les statistiques

Testez :

```sql
-- Cette requête devrait retourner les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'analytics_events';
```

## 📈 Utilisation dans l'application

### Tracking automatique

Le tracking est déjà intégré dans l'application :

```javascript
import analyticsService from './services/analyticsService';

// Tracker une page
analyticsService.trackPageView('home');

// Tracker la vue d'un scénario
analyticsService.trackScenarioView(scenario, campaign);

// Tracker un téléchargement
analyticsService.trackDownload(scenario, 'scenario');

// Tracker un ajout au panier
analyticsService.trackAddToCart(item, 'scenario');

// Tracker un achat
analyticsService.trackPurchase(cart, total);
```

### Récupérer les statistiques (Admin)

```javascript
// Stats en temps réel (24h)
const realtimeStats = await analyticsService.getRealtimeStats();

// Stats par thème (30 jours)
const themeStats = await analyticsService.getStatsByTheme();

// Top 10 scénarios
const topScenarios = await analyticsService.getTopScenarios();

// Heures de pointe
const peakHours = await analyticsService.getPeakHours();

// Stats générales
const generalStats = await analyticsService.getGeneralStats(30);
```

## 🧹 Maintenance

### Nettoyer les anciennes données (90 jours)

Exécutez cette fonction régulièrement (ou configurez une tâche cron) :

```sql
SELECT cleanup_old_analytics();
```

### Agréger les statistiques quotidiennes

Pour de meilleures performances, vous pouvez créer une fonction pour agréger les stats quotidiennes :

```sql
-- À exécuter chaque jour à minuit
INSERT INTO analytics_daily_stats (
    stat_date,
    total_visits,
    unique_sessions,
    medieval_views,
    lovecraft_views,
    scifi_views,
    total_downloads,
    total_cart_adds,
    total_purchases,
    total_revenue
)
SELECT 
    CURRENT_DATE - INTERVAL '1 day' as stat_date,
    COUNT(*) FILTER (WHERE event_type = 'page_view'),
    COUNT(DISTINCT session_id),
    COUNT(*) FILTER (WHERE event_category = 'medieval'),
    COUNT(*) FILTER (WHERE event_category = 'lovecraft'),
    COUNT(*) FILTER (WHERE event_category = 'scifi'),
    COUNT(*) FILTER (WHERE event_type = 'download'),
    COUNT(*) FILTER (WHERE event_type = 'cart_add'),
    COUNT(*) FILTER (WHERE event_type = 'purchase'),
    SUM(event_value) FILTER (WHERE event_type = 'purchase')
FROM analytics_events
WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
ON CONFLICT (stat_date) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    unique_sessions = EXCLUDED.unique_sessions,
    medieval_views = EXCLUDED.medieval_views,
    lovecraft_views = EXCLUDED.lovecraft_views,
    scifi_views = EXCLUDED.scifi_views,
    total_downloads = EXCLUDED.total_downloads,
    total_cart_adds = EXCLUDED.total_cart_adds,
    total_purchases = EXCLUDED.total_purchases,
    total_revenue = EXCLUDED.total_revenue,
    updated_at = NOW();
```

## 📊 Visualisation

Les statistiques sont accessibles dans l'interface admin :
- `/admin` → Onglet "Stats"
- Nécessite une authentification admin

## 🔒 Sécurité

- ✅ Les événements peuvent être insérés par n'importe qui (nécessaire pour le tracking)
- ✅ Seuls les admins authentifiés peuvent lire les statistiques
- ✅ Les données sensibles (IP, user agent) sont stockées mais jamais exposées publiquement
- ✅ Les anciennes données sont automatiquement supprimées après 90 jours

## 🐛 Dépannage

### Les événements ne sont pas insérés

1. Vérifiez que la table existe :
```sql
SELECT * FROM analytics_events LIMIT 1;
```

2. Vérifiez les permissions RLS :
```sql
SELECT * FROM pg_policies WHERE tablename = 'analytics_events';
```

3. Vérifiez les logs dans la console du navigateur

### Les statistiques n'apparaissent pas

1. Vérifiez que vous êtes connecté en tant qu'admin
2. Vérifiez que des événements ont été créés :
```sql
SELECT COUNT(*) FROM analytics_events;
```

3. Testez les vues directement :
```sql
SELECT * FROM analytics_realtime;
SELECT * FROM analytics_by_theme;
```

## 📝 Notes

- Les statistiques sont calculées en temps réel pour les dernières 24h
- Les vues par thème couvrent les 30 derniers jours
- Les données brutes sont conservées pendant 90 jours
- Le système est conçu pour être léger et performant
