# 🏷️ Guide du Système de Tags Structuré

## Vue d'ensemble

Le système de tags permet de catégoriser les scénarios de manière cohérente et professionnelle avec 40+ tags prédéfinis répartis en 6 catégories.

## 📋 Structure

### Tables Supabase
- **`tags`** : Tags prédéfinis avec nom, catégorie, couleur
- **`scenario_tags`** : Association many-to-many scénarios ↔ tags

### 6 Catégories de Tags

#### 1. Genre
Horreur, Enquête, Combat, Exploration, Social, Mystère, Survival, Intrigue Politique

#### 2. Ambiance
Sombre, Épique, Angoissante, Légère, Mystique, Dramatique, Humoristique

#### 3. Difficulté
Débutant, Intermédiaire, Avancé, Expert

#### 4. Durée
One-Shot, Courte (1-3h), Moyenne (4-6h), Longue (7h+), Campagne

#### 5. Type
Urbain, Dungeon, Wilderness, Mer/Océan, Espace, Plan Extraplanaire, Village, Château

#### 6. Thème
Lovecraftien, Fantastique Médiéval, Cyberpunk, Post-Apocalyptique, Steampunk, Pirates, Vampires, Dragons

## 🚀 Installation

### 1. Exécuter le script SQL

Dans votre **Supabase SQL Editor**, exécutez :
```sql
-- Contenu du fichier supabase/CREATE_TAGS_SYSTEM.sql
```

### 2. Vérifier l'installation

```sql
-- Compter les tags créés
SELECT category, COUNT(*) 
FROM tags 
GROUP BY category 
ORDER BY category;

-- Devrait retourner ~40 tags répartis en 6 catégories
```

## 💻 Utilisation dans le Code

### Récupérer tous les tags

```javascript
import { supabaseService } from './services/supabaseService';

// Tous les tags
const tags = await supabaseService.getTags();

// Tags groupés par catégorie
const tagsByCategory = await supabaseService.getTagsByCategory();
// Retourne : { Genre: [...], Ambiance: [...], Difficulté: [...], ... }
```

### Assigner des tags à un scénario

```javascript
// Créer un scénario puis assigner des tags
const scenario = await supabaseService.createScenario(campaignId, scenarioData);

// Assigner les tags (par IDs)
await supabaseService.setScenarioTags(scenario.id, [1, 5, 12]); // IDs des tags
```

### Récupérer les tags d'un scénario

```javascript
const tags = await supabaseService.getScenarioTags(scenarioId);
// Retourne un tableau d'objets tags complets
```

### Rechercher des scénarios par tags

```javascript
const scenarios = await supabaseService.searchScenariosByTags([1, 5]); // Recherche avec tag IDs
```

## 🎨 Affichage des Tags

Chaque tag a une couleur hexadécimale pour un affichage cohérent :

```jsx
<span style={{
  backgroundColor: tag.color,
  color: 'white',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '0.875rem',
  fontWeight: 600
}}>
  {tag.name}
</span>
```

## 🛠️ Interface Admin (À implémenter)

### Sélecteur de Tags pour Scénarios

```jsx
const TagSelector = ({ selectedTagIds, onChange, tagsByCategory }) => {
  return (
    <div className="space-y-4">
      {Object.entries(tagsByCategory).map(([category, tags]) => (
        <div key={category}>
          <h4 className="font-bold text-amber-900 mb-2">{category}</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  if (isSelected) {
                    onChange(selectedTagIds.filter(id => id !== tag.id));
                  } else {
                    onChange([...selectedTagIds, tag.id]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? 'ring-2 ring-offset-2 ring-blue-500'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: tag.color,
                  color: 'white'
                }}>
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🔧 Gestion des Tags (Admin)

### Créer un nouveau tag

```javascript
const newTag = await supabaseService.createTag({
  name: 'Zombies',
  category: 'Thème',
  color: '#166534',
  description: 'Scénarios avec des zombies'
});
```

### Modifier un tag

```javascript
await supabaseService.updateTag(tagId, {
  name: 'Horreur Cosmique',
  color: '#7f1d1d'
});
```

### Désactiver un tag

```javascript
await supabaseService.deleteTag(tagId); // Le tag est désactivé, pas supprimé
```

## 🔍 Recherche et Filtrage

### Exemple : Recherche par tag dans l'interface

```jsx
const [selectedTag, setSelectedTag] = useState(null);
const [filteredScenarios, setFilteredScenarios] = useState([]);

const handleTagClick = async (tagId) => {
  const scenarios = await supabaseService.searchScenariosByTags([tagId]);
  setFilteredScenarios(scenarios);
  setSelectedTag(tagId);
};
```

## 📊 Statistiques

### Voir les tags les plus utilisés

```sql
SELECT * FROM tag_usage_stats 
ORDER BY scenario_count DESC 
LIMIT 10;
```

## 🔐 Sécurité

- **Lecture** : Tout le monde peut voir les tags
- **Écriture** : Seuls les admins peuvent créer/modifier/supprimer des tags
- **RLS** : Politiques Row Level Security activées

## 🚀 Prochaines Étapes

1. ✅ Tables créées dans Supabase
2. ✅ Fonctions JavaScript dans `supabaseService.js`
3. ⏳ Créer l'interface admin pour gérer les tags
4. ⏳ Modifier le formulaire de scénario pour sélectionner les tags
5. ⏳ Afficher les tags sur les cartes de scénarios
6. ⏳ Implémenter la recherche par tags dans l'interface

## 📝 Notes Techniques

- Les tags utilisent une relation **many-to-many** via la table `scenario_tags`
- Un scénario peut avoir **plusieurs tags**
- Un tag peut être assigné à **plusieurs scénarios**
- Les tags désactivés (`is_active = false`) ne sont plus affichés mais restent en base
- Migration automatique des anciens tags textuels disponible via `migrate_text_tags_to_structured()`

## 🎯 Exemple Complet

```javascript
// 1. Charger les tags
const tagsByCategory = await supabaseService.getTagsByCategory();

// 2. Créer un scénario
const scenario = await supabaseService.createScenario(campaignId, {
  title: 'Le Manoir Hanté',
  displayName: 'Chapitre I : Le Manoir Hanté',
  author: 'John Doe',
  description: 'Une enquête horrifique...',
  // ... autres champs
});

// 3. Assigner des tags
// Genre: Horreur (1), Ambiance: Angoissante (3), Durée: Moyenne (6)
await supabaseService.setScenarioTags(scenario.id, [1, 3, 6]);

// 4. Récupérer les tags du scénario
const scenarioTags = await supabaseService.getScenarioTags(scenario.id);
console.log(scenarioTags); // [{id: 1, name: 'Horreur', ...}, ...]
```

## 🆘 Dépannage

### Les tags n'apparaissent pas
```sql
-- Vérifier que les tags existent
SELECT COUNT(*) FROM tags WHERE is_active = true;

-- Vérifier les politiques RLS
SELECT * FROM pg_policies WHERE tablename = 'tags';
```

### Erreur lors de l'assignation
```sql
-- Vérifier que le scénario existe
SELECT id FROM scenarios WHERE id = YOUR_SCENARIO_ID;

-- Vérifier que les tags existent
SELECT id FROM tags WHERE id IN (1, 2, 3);
```

---

**Système créé le** : 15 décembre 2025
**Version** : 1.0
