# 📊 Intégration du Système Analytics - Guide Complet

## ✅ Ce qui a été créé

### 1. Schéma de base de données (`supabase/ANALYTICS_SCHEMA.sql`)
- ✅ Table `analytics_events` pour stocker tous les événements
- ✅ Table `analytics_daily_stats` pour les stats agrégées
- ✅ Vues SQL pour des requêtes rapides
- ✅ Politiques RLS pour la sécurité
- ✅ Fonction de nettoyage automatique

### 2. Service de tracking (`src/services/analyticsService.js`)
- ✅ Fonction `trackEvent()` générique
- ✅ Méthodes spécifiques : `trackPageView()`, `trackScenarioView()`, `trackDownload()`, `trackAddToCart()`, `trackPurchase()`
- ✅ Méthodes pour récupérer les stats : `getGeneralStats()`, `getRealtimeStats()`, etc.

### 3. Composant d'affichage (`src/components/StatsDisplay.jsx`)
- ✅ Interface admin avec vraies données
- ✅ Statistiques générales, temps réel, par thème
- ✅ Top scénarios, heures de pointe
- ✅ Rafraîchissement automatique

### 4. Documentation
- ✅ `ANALYTICS_SETUP.md` - Guide d'installation Supabase
- ✅ `ANALYTICS_INTEGRATION.md` - Ce document

## 🚀 Étapes d'installation

### Étape 1 : Installer le schéma dans Supabase

1. Ouvrez votre **Supabase Dashboard**
2. Allez dans **SQL Editor**
3. Copiez tout le contenu de `supabase/ANALYTICS_SCHEMA.sql`
4. Exécutez le script (bouton "Run")
5. Vérifiez que les tables et vues sont créées :

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'analytics%';
```

### Étape 2 : Vérifier l'intégration dans le code

Le code principal (`src/main.jsx`) doit :

1. **Importer le service** :
```javascript
import analyticsService from './services/analyticsService';
```

2. **Importer le composant** :
```javascript
import StatsDisplay from './components/StatsDisplay';
```

3. **Tracker les événements** aux bons endroits :

```javascript
// Au changement de page
useEffect(() => {
  if (currentPage) {
    analyticsService.trackPageView(currentPage);
  }
}, [currentPage]);

// À l'ouverture d'une section
const openBook = (theme) => {
  analyticsService.trackPageView('scenarios', theme.id);
  // ... reste du code
};

// Vue d'un scénario
const handleScenarioClick = (scenario) => {
  analyticsService.trackScenarioView(scenario, selectedSaga);
  setViewingScenario(scenario);
};

// Téléchargement
const handleDownloadFree = (pdfUrl, name, item, type) => {
  analyticsService.trackDownload(item, type);
  if (pdfUrl) {
    alert(`Téléchargement de "${name}" en cours...`);
  }
};

// Ajout au panier
const addToCart = (item) => {
  analyticsService.trackAddToCart(item.item, item.type);
  // ... reste du code
};

// Achat (après confirmation de paiement)
const handleOrderComplete = (formData) => {
  analyticsService.trackPurchase(cart, totalAmount);
  setOrderData(formData);
  setCurrentPage('confirmation');
};
```

4. **Remplacer la page Stats** :
```javascript
{/* PAGE STATS */}
{!showBook && currentPage === 'stats' && (
  <div className="min-h-screen p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-5xl font-bold mb-8 text-amber-300 text-center">📊 Statistiques</h1>
      <div className="bg-amber-100 border-4 border-amber-900 rounded-2xl p-8 shadow-2xl">
        <StatsDisplay />
      </div>
    </div>
  </div>
)}
```

### Étape 3 : Tester le système

1. **Tester l'insertion d'événements** :
   - Naviguez sur le site
   - Ouvrez la console (F12)
   - Vérifiez les messages : `✅ Événement tracké: page_view`

2. **Vérifier dans Supabase** :
```sql
-- Voir les derniers événements
SELECT * FROM analytics_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Voir les stats temps réel
SELECT * FROM analytics_realtime;
```

3. **Vérifier dans l'admin** :
   - Connectez-vous en tant qu'admin
   - Allez sur la page "Stats"
   - Les statistiques doivent s'afficher

## 📈 Événements trackés

| Événement | Déclenché quand | Données enregistrées |
|-----------|----------------|---------------------|
| `page_view` | Navigation sur une page | Page, catégorie |
| `scenario_view` | Ouverture d'un scénario | Scénario ID, Campagne ID, Thème |
| `download` | Téléchargement PDF | Item ID, Type (scenario/campaign) |
| `cart_add` | Ajout au panier | Item ID, Prix, Type |
| `purchase` | Achat confirmé | Items, Prix total |

## 🔍 Vérifications

### Vérifier que tout fonctionne :

```javascript
// Dans la console du navigateur (F12)
import analyticsService from './services/analyticsService';

// Tester un événement
await analyticsService.trackPageView('test_page');

// Récupérer des stats (nécessite d'être admin)
const stats = await analyticsService.getGeneralStats(7);
console.log(stats);
```

### Dans Supabase :

```sql
-- Nombre total d'événements
SELECT COUNT(*) FROM analytics_events;

-- Par type
SELECT event_type, COUNT(*) as count
FROM analytics_events
GROUP BY event_type
ORDER BY count DESC;

-- Dernières 24h
SELECT * FROM analytics_realtime;
```

## 🎯 Prochaines étapes

1. ✅ Installer le schéma SQL dans Supabase
2. ✅ Vérifier l'intégration dans main.jsx
3. ✅ Tester le tracking sur le site
4. ⬜ Laisser accumuler des données (24-48h)
5. ⬜ Vérifier les statistiques dans l'admin

## 🐛 Dépannage

### Problème : Les événements ne sont pas insérés

**Solution** : Vérifiez les politiques RLS :
```sql
SELECT * FROM pg_policies WHERE tablename = 'analytics_events';
```

Vous devez avoir une politique `Anyone can insert analytics events`.

### Problème : Les stats ne s'affichent pas

**Solution** : Vérifiez que vous êtes connecté en tant qu'admin et que des événements existent :
```sql
SELECT COUNT(*) FROM analytics_events;
```

### Problème : Erreur CORS ou permissions

**Solution** : Les vues doivent avoir les bonnes permissions. Réexécutez le schéma SQL.

## 📝 Notes importantes

- ✅ Le tracking est **anonyme** (pas de données personnelles)
- ✅ Les données sont **automatiquement nettoyées** après 90 jours
- ✅ Seuls les **admins authentifiés** peuvent voir les stats
- ✅ Le système est **léger et performant** (pas d'impact sur l'UX)
- ✅ Compatible avec **RGPD** (données anonymisées)

## 🔐 Sécurité

- Les événements peuvent être insérés par n'importe qui (nécessaire pour le tracking)
- Seuls les admins peuvent lire les statistiques
- Pas de données personnelles stockées
- Nettoyage automatique après 90 jours

## 🎉 Résultat final

Vous aurez désormais :
- 📊 Des **statistiques réelles** basées sur les vraies visites
- 📈 Un **dashboard** professionnel dans l'admin
- 🎯 Des **insights** sur les scénarios les plus populaires
- ⏰ Les **heures de pointe** d'activité
- 🌍 La **répartition** par thème

Bon tracking ! 🚀
