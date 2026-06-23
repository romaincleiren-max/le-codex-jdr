const fs = require('fs');
const path = require('path');

const CODEX_PATH = path.join(__dirname, '..', 'data', 'CODEX.json');
const OUT_PATH = path.join(__dirname, '..', 'public', 'codex_index.json');

// Target categories to include (id -> display name)
const TARGET_CATEGORIES = {
  'clxhwpec512jj356km1eoexsr': 'Nourriture',
  'ar56rtue': 'Flore',
  'l357ab2t': 'Ingrédients',
  'yk873o74': 'Tissus',
  'yzanz9qx': 'Substances & Potions',
  'clxhwz8lw12w4356kmwiunpyj': 'Boissons',
  'qhd7t6ld': 'Minéraux & Métaux',
  'clxgpdznk1abg356k8k8obrun': 'Bibliothèque',
  'cly1zl4ad0u4l356l4rfbrtyl': 'Objets magiques',
  'clyyqy6mj0aak356l3nvr8lme': 'Moyens de Transport',
  'clxhcyyx20dnp356kgcb5vypo': 'Monnaies',
};

// Rarity mapping (FR labels → normalized)
const RARITY_MAP = {
  'courant': 'Courant',
  'commun': 'Courant',
  'peu courant': 'Peu courant',
  'inhabituel': 'Peu courant',
  'rare': 'Rare',
  'très rare': 'Très rare',
  'tres rare': 'Très rare',
  'légendaire': 'Légendaire',
  'legendaire': 'Légendaire',
  'artefact': 'Artefact',
  'unique': 'Unique',
};

// item_type per category
const CATEGORY_ITEM_TYPE = {
  'Nourriture': 'Nourriture',
  'Flore': 'Flore',
  'Ingrédients': 'Ingrédient',
  'Tissus': 'Tissu',
  'Substances & Potions': 'Potion',
  'Boissons': 'Boisson',
  'Minéraux & Métaux': 'Matériau',
  'Bibliothèque': 'Livre',
  'Objets magiques': 'Objet magique',
  'Moyens de Transport': 'Transport',
  'Monnaies': 'Monnaie',
};

function extractText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.content) return node.content.map(extractText).join('');
  return '';
}

function extractParagraphs(node, results) {
  results = results || [];
  if (!node) return results;
  if (node.type === 'paragraph') {
    const text = extractText(node).trim();
    if (text) results.push(text);
  }
  if (node.content) node.content.forEach(function(c) { extractParagraphs(c, results); });
  return results;
}

function extractBlockquote(node) {
  if (!node) return '';
  if (node.type === 'blockquote') return extractText(node).trim();
  if (node.content) {
    for (var i = 0; i < node.content.length; i++) {
      var r = extractBlockquote(node.content[i]);
      if (r) return r;
    }
  }
  return '';
}

function findFirstImage(node) {
  if (!node) return null;
  if (node.type === 'media' && node.attrs && node.attrs.url) return node.attrs.url;
  if (node.content) {
    for (var i = 0; i < node.content.length; i++) {
      var img = findFirstImage(node.content[i]);
      if (img) return img;
    }
  }
  return null;
}

function extractSprite(resource) {
  var props = resource.properties || [];
  var spriteProp = props.find(function(p) {
    return p.type === 'IMAGE' && p.title && p.title.toUpperCase() === 'SPRITE' && p.data && p.data.url;
  });
  return spriteProp ? spriteProp.data.url : null;
}

function extractRarity(text) {
  var lower = text.toLowerCase();
  for (var key in RARITY_MAP) {
    if (lower.includes(key)) return RARITY_MAP[key];
  }
  return null;
}

function extractItem(resource, categoryName) {
  var doc = resource.documents && resource.documents[0];
  var content = doc && doc.content;

  var image = content ? findFirstImage(content) : null;
  var sprite = extractSprite(resource);
  var citation = content ? extractBlockquote(content) : '';
  var paragraphs = content ? extractParagraphs(content) : [];

  // Patterns that indicate template placeholders or pure section labels — skip them
  var SKIP_EXACT = [
    'X', 'x', 'Description', 'Contenu', 'contenu', 'Titre', 'Sous-titre',
    'Première. Description', 'Deuxième. Description', 'Troisième. Description',
    'Description physique', 'Description physique de la plante',
    'Ingrédients', 'Ingrédient', 'Ingrédient de la recette', 'Quantité',
    'Type de recette', 'Détails', 'Effets', 'Effet', 'Propriétés',
    'Histoire', 'Information clés', 'Informations', 'Intérêt',
    'Information secrète', 'Informations secrètes',
    'Nom vernaculaire de la plante / Surnom',
    'Nom scientifique : de la plante', 'Nom de l\'Habitat',
    'Citation dans une littérature scientifique ou utilisation de la plante lors d\'un évènement majeur...',
    'Citation dans une littérature scientifique ou utilisation de la plante lors d\'un évènement majeur... Lore.',
    'Type, rareté (Liaison ou non)', 'Lore.', 'Citation',
    'Potion', 'Cuisine',
  ];
  var SKIP_STARTS = ['Raret', 'Temps de fabrication', 'Jets de sauvegarde', 'Titre :', 'Titre:'];
  // Strip leading placeholder "X " from paragraphs (LegendKeeper field label pattern)
  function cleanXPrefix(p) {
    return p.replace(/^X\s+/, '').replace(/^x\s+/, '');
  }
  // Lines that are only placeholder X with possible surrounding spaces
  function isXPlaceholder(p) {
    return /^\s*[Xx]\s*$/.test(p);
  }
  var SKIP_CONTAINS = ['discrétion du mj', 'informations secrètes'];

  var descParts = paragraphs
    .map(cleanXPrefix)
    .filter(function(p) {
      if (!p || !p.trim()) return false;
      // Skip pure X placeholders
      if (isXPlaceholder(p)) return false;
      // Skip exact label matches
      for (var i = 0; i < SKIP_EXACT.length; i++) {
        if (p.trim() === SKIP_EXACT[i]) return false;
      }
      var lower = p.toLowerCase();
      // Skip lines starting with certain labels
      for (var j = 0; j < SKIP_STARTS.length; j++) {
        if (p.startsWith(SKIP_STARTS[j])) return false;
      }
      // Skip lines containing secret info
      for (var k = 0; k < SKIP_CONTAINS.length; k++) {
        if (lower.includes(SKIP_CONTAINS[k])) return false;
      }
      // Skip very short lines that are probably leftover labels (1-3 chars)
      if (p.trim().length <= 3) return false;
      return true;
    });

  var desc = descParts.join('\n').trim();

  // Extract rarity — look for "Rareté : <value>" pattern first, then fallback to first paragraph
  var rarity = null;
  for (var i = 0; i < paragraphs.length && !rarity; i++) {
    var m = paragraphs[i].match(/Raret[eé]\s*:\s*(.+)/i);
    if (m) {
      var rawRarity = m[1].trim();
      // Only use if it's not a placeholder
      if (rawRarity && !/^X+$/.test(rawRarity)) {
        rarity = extractRarity(rawRarity) || rawRarity;
      }
    }
  }
  // Fallback: extract from first paragraph (magic items format: "Arme, Très rare (Liaison)")
  if (!rarity && paragraphs[0]) {
    rarity = extractRarity(paragraphs[0]);
  }

  // Extract D&D5e item type from first paragraph: "Arme, Légendaire..." → "Arme"
  // Pattern: word(s) before first comma or parenthesis
  var dnd_type = null;
  if (categoryName === 'Objets magiques' && paragraphs[0]) {
    var tm = paragraphs[0].match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-]*?)(?:\s*[,(]|$)/);
    if (tm) {
      var candidate = tm[1].trim();
      // Ignore if it looks like a sentence (too long or contains common words)
      if (candidate.length <= 30 && !/\b(le|la|les|un|une|des|du|de)\b/i.test(candidate)) {
        dnd_type = candidate;
      }
    }
  }

  // Attunement detection
  var fullText = paragraphs.join(' ').toLowerCase();
  var attunement = fullText.includes('harmonisation') || fullText.includes('s\'harmoniser') || fullText.includes('nécessite une harmonisation');

  return {
    id: resource.id,
    name: resource.name,
    category: categoryName,
    item_type: CATEGORY_ITEM_TYPE[categoryName] || categoryName,
    dnd_type: dnd_type || null,
    desc: desc,
    citation: citation,
    image: image || '',
    sprite: sprite || '',
    rarity: rarity || '',
    attunement: attunement,
  };
}

console.log('Reading CODEX.json...');
var raw = fs.readFileSync(CODEX_PATH, 'utf8');
console.log('Parsing JSON...');
var codex = JSON.parse(raw);
var resources = codex.resources;
console.log('Total resources:', resources.length);

// Build parent→children map for fast lookup
var childrenOf = {};
resources.forEach(function(r) {
  if (r.parentId) {
    if (!childrenOf[r.parentId]) childrenOf[r.parentId] = [];
    childrenOf[r.parentId].push(r);
  }
});

// Recursively get all leaf items under a category (skip sub-category folders)
function getLeafItems(catId, catName) {
  var direct = childrenOf[catId] || [];
  var items = [];
  direct.forEach(function(child) {
    // If this child has its own children, it's a subcategory folder
    var grandChildren = childrenOf[child.id] || [];
    if (grandChildren.length > 0) {
      // Recurse into subcategory, keeping parent category name
      items = items.concat(getLeafItems(child.id, catName));
    } else {
      items.push(extractItem(child, catName));
    }
  });
  return items;
}

var result = [];
for (var catId in TARGET_CATEGORIES) {
  var catName = TARGET_CATEGORIES[catId];
  var items = getLeafItems(catId, catName);
  console.log(catName + ':', items.length, 'items');
  result = result.concat(items);
}

console.log('\nTotal items:', result.length);
fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8');
console.log('Written to:', OUT_PATH);
