# 🎯 État de l'intégration Supabase

## ✅ Ce qui fonctionne déjà

### 1. Infrastructure Supabase
- ✅ Configuration `.env` avec clés API
- ✅ Client Supabase initialisé (`src/lib/supabase.js`)
- ✅ Base de données créée avec 6 tables
- ✅ 3 thèmes préchargés dans la base

### 2. Services et Hooks
- ✅ `supabaseService.js` - Toutes les fonctions CRUD prêtes
- ✅ `useSupabaseData.js` - Hook React fonctionnel
- ✅ Page de test `/test-supabase` validée

### 3. Chargement des données
- ✅ L'app charge maintenant les campagnes depuis Supabase
- ✅ L'app charge les thèmes depuis Supabase
- ✅ Synchronisation automatique avec useEffect

## ⚠️ Ce qui reste à faire

### Fonctions à modifier dans `src/main.jsx`

#### 1. `saveCampaign` (ligne ~1830)
**Actuellement :** Modifie le state local
```javascript
const saveCampaign = (campaignData) => {
  // ... validation ...
  if (editingSaga) {
    setSagas(sagas.map(s => s.id === validCampaign.id ? validCampaign : s));
  } else {
    setSagas([...sagas, validCampaign]);
  }
};
```

**À modifier en :**
```javascript
const saveCampaign = async (campaignData) => {
  const validThemeIds = ['medieval', 'lovecraft', 'scifi'];
  const cleanThemeId = String(campaignData.themeId || 'medieval').trim().toLowerCase();
  const finalThemeId = validThemeIds.includes(cleanThemeId) ? cleanThemeId : 'medieval';
  
  const validCampaign = {
    ...campaignData,
    themeId: finalThemeId,
    id: campaignData.id || Date.now()
  };
  
  try {
    if (editingSaga) {
      // Modifier dans Supabase
      await supabaseService.updateCampaign(validCampaign.id, validCampaign);
    } else {
      // Créer dans Supabase
      await supabaseService.createCampaign(validCampaign);
    }
    
    // Le hook useSupabaseData va recharger automatiquement
    setShowCampaignModal(false);
    setEditingSaga(null);
  } catch (error) {
    console.error('Erreur sauvegarde campagne:', error);
    alert('❌ Erreur lors de la sauvegarde');
  }
};
```

#### 2. `deleteCampaign` (ligne ~1845)
**Actuellement :**
```javascript
const deleteCampaign = (id) => {
  if (confirm('Supprimer cette campagne ?')) 
    setSagas(sagas.filter(s => s.id !== id));
};
```

**À modifier en :**
```javascript
const deleteCampaign = async (id) => {
  if (confirm('Supprimer cette campagne ?')) {
    try {
      await supabaseService.deleteCampaign(id);
      // Le hook useSupabaseData va recharger automatiquement
    } catch (error) {
      console.error('Erreur suppression campagne:', error);
      alert('❌ Erreur lors de la suppression');
    }
  }
};
```

#### 3. `saveScenario` (ligne ~1848)
**Actuellement :** Modifie les scénarios dans le state local
```javascript
const saveScenario = (scenarioData) => {
  if (!selectedSagaIdForScenarios) return;
  // ... logique de mise à jour du state local ...
  setSagas(updatedSagas);
};
```

**À modifier en :**
```javascript
const saveScenario = async (scenarioData) => {
  if (!selectedSagaIdForScenarios) return;

  try {
    if (editingScenario) {
      // Modifier le scénario existant
      await supabaseService.updateScenario(
        selectedSagaIdForScenarios,
        scenarioData.id,
        scenarioData
      );
    } else {
      // Ajouter un nouveau scénario
      await supabaseService.addScenario(
        selectedSagaIdForScenarios,
        scenarioData
      );
    }
    
    setShowScenarioModal(false);
    setEditingScenario(null);
    // Le hook useSupabaseData va recharger automatiquement
  } catch (error) {
    console.error('Erreur sauvegarde scénario:', error);
    alert('❌ Erreur lors de la sauvegarde');
  }
};
```

#### 4. `deleteScenario` (ligne ~1875)
**À modifier similairement avec :**
```javascript
const deleteScenario = async (sagaId, scenarioId) => {
  if (confirm('Supprimer ce scénario ?')) {
    try {
      await supabaseService.deleteScenario(sagaId, scenarioId);
    } catch (error) {
      console.error('Erreur suppression scénario:', error);
      alert('❌ Erreur lors de la suppression');
    }
  }
};
```

#### 5. `saveThemeBackgroundImage` (ligne ~1889)
**À modifier pour sauver dans Supabase :**
```javascript
const saveThemeBackgroundImage = async (themeId, newImageUrl) => {
  try {
    await supabaseService.updateTheme(themeId, { backgroundImage: newImageUrl });
    // Le hook useSupabaseData va recharger automatiquement
  } catch (error) {
    console.error('Erreur mise à jour thème:', error);
    alert('❌ Erreur lors de la mise à jour');
  }
};
```

## 🚀 Procédure de basculement complète

### Étape 1 : Modifications du code (à faire)
```bash
# Modifier les 5 fonctions listées ci-dessus dans src/main.jsx
```

### Étape 2 : Supprimer les effets localStorage (optionnel)
Supprimer ou commenter ces useEffect qui ne servent plus :
- Ligne ~1820 : `useEffect(() => { localStorage.setItem('le-codex-sagas', ...) }, [sagas])`
- Ligne ~1825 : `useEffect(() => { localStorage.setItem('le-codex-themes', ...) }, [themes])`

### Étape 3 : Tester
1. Créer une campagne → doit apparaître dans Supabase
2. Modifier une campagne → doit se mettre à jour
3. Supprimer une campagne → doit disparaître
4. Rafraîchir la page → les données persistent

## 📝 Notes importantes

### Rechargement automatique
Grâce au hook `useSupabaseData`, l'app recharge automatiquement les données toutes les 5 secondes. Pas besoin de gérer manuellement la mise à jour du state après chaque opération.

### Gestion d'erreurs
Toutes les opérations Supabase sont dans des try/catch pour gérer les erreurs réseau ou de permission.

### Compatibilité
Les modifications sont rétrocompatibles. Si Supabase est indisponible, l'app utilisera les données en cache du hook.

## 🎯 Prochaine action recommandée

**Option A : Je termine les modifications maintenant**
- Je modifie les 5 fonctions
- Je teste le tout
- L'app est 100% Supabase

**Option B : Tu testes d'abord le chargement**
- Lance l'app avec `npm run dev`
- Vérifie que les campagnes s'affichent depuis Supabase
- Puis je finalise les fonctions de sauvegarde

**Que préfères-tu ?** 🤔
