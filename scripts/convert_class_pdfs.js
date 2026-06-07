/**
 * Convertit les PDF d'icônes de classes en PNG pour le bucket Supabase "classes"
 *
 * Usage :
 *   1. Mets tes PDF dans data/class-pdfs/
 *   2. npm run convert-classes
 *   3. Uploade les PNG depuis data/class-icons/ vers le bucket Supabase "classes"
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Fix Windows : pdf-to-png-converter génère des chemins avec backslash (\)
// mais pdfjs-dist exige des URLs se terminant par /  → on patch normalizePath
// avant le premier require de pdf-to-png-converter
if (process.platform === 'win32') {
  const { createRequire } = require('module');
  // Créer un require depuis la racine du package pour contourner les exports restrictions
  // resolve() donne le chemin du out/index.js — on crée un require depuis ce dossier
  const outDir = path.dirname(require.resolve('pdf-to-png-converter'));
  const pkgRequire = createRequire(path.join(outDir, 'index.js'));
  const normMod = pkgRequire('./normalizePath.js');
  const orig = normMod.normalizePath;
  normMod.normalizePath = (p) => {
    const abs = orig(p);
    return pathToFileURL(abs).href.replace(/\/?$/, '/');
  };
}
const { pdfToPng } = require('pdf-to-png-converter');

const INPUT_DIR  = path.join(__dirname, '../data/class-pdfs');
const OUTPUT_DIR = path.join(__dirname, '../data/class-icons');

// Correspondance nom classe (minuscules sans accents) → nom fichier Supabase
const NAME_MAP = {
  // Anglais (noms dans les PDF)
  'barbarian':  'Classe - Barbare.png',
  'bard':       'Classe - Barde.png',
  'cleric':     'Classe - Clerc.png',
  'druid':      'Classe - Druide.png',
  'fighter':    'Classe - Guerrier.png',
  'monk':       'Classe - Moine.png',
  'paladin':    'Classe - Paladin.png',
  'ranger':     'Classe - Rodeur.png',
  'rogue':      'Classe - Roublard.png',
  'sorcerer':   'Classe - Ensorceleur.png',
  'warlock':    'Classe - Occultiste.png',
  'wizard':     'Classe - Magicien.png',
  // Français
  'barbare':    'Classe - Barbare.png',
  'barde':      'Classe - Barde.png',
  'clerc':      'Classe - Clerc.png',
  'druide':     'Classe - Druide.png',
  'guerrier':   'Classe - Guerrier.png',
  'moine':      'Classe - Moine.png',
  'rodeur':     'Classe - Rodeur.png',
  'roublard':   'Classe - Roublard.png',
  'ensorceleur':'Classe - Ensorceleur.png',
  'occultiste': 'Classe - Occultiste.png',
  'magicien':   'Classe - Magicien.png',
};

// Extrait le nom de classe depuis des patterns comme "Class Icon - Fighter (2)"
function extractClassName(basename) {
  const m = basename.match(/class\s+icon\s*[-–]\s*(.+?)(?:\s*\(\d+\))?$/i);
  if (m) {
    return m[1].trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  return basename.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

async function removeWhiteBackground(inputBuffer) {
  const img = sharp(inputBuffer);
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  const WHITE_THRESHOLD = 240;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      pixels[i+3] = 0;
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();
}

async function convertPdf(pdfPath, outputName) {
  console.log(`  ${path.basename(pdfPath)} → ${outputName}`);

  const pages = await pdfToPng(pdfPath, {
    disableFontFace:      false,
    useSystemFonts:       true,
    viewportScale:        4.0,
    pagesToProcess:       [1],
    strictPagesToProcess: false,
    verbosityLevel:       0,
  });

  if (!pages.length) {
    console.error(`  ✗ Aucune page extraite`);
    return;
  }

  const pngBuffer = pages[0].content;

  // Détecter fond blanc via la couleur dominante
  const stats = await sharp(pngBuffer).stats();
  const d = stats.dominant;
  const isWhiteBg = d.r > 230 && d.g > 230 && d.b > 230;

  let finalBuffer;
  if (isWhiteBg) {
    console.log(`    → Fond blanc détecté, suppression...`);
    finalBuffer = await removeWhiteBackground(pngBuffer);
  } else {
    finalBuffer = await sharp(pngBuffer).png().toBuffer();
    console.log(`    → Fond conservé`);
  }

  // Recadrer les marges transparentes
  try {
    finalBuffer = await sharp(finalBuffer).trim({ threshold: 10 }).toBuffer();
  } catch (e) {
    // trim() peut échouer si l'image est entièrement transparente
  }

  const outPath = path.join(OUTPUT_DIR, outputName);
  fs.writeFileSync(outPath, finalBuffer);
  console.log(`  ✓ ${outPath}`);
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log(`Dossier créé : ${INPUT_DIR}\nMets tes PDF dedans puis relance.`);
    return;
  }
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const pdfs = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) { console.log('Aucun PDF trouvé dans', INPUT_DIR); return; }

  console.log(`\n${pdfs.length} PDF trouvé(s)\n`);
  const skipped = [];

  for (const pdf of pdfs) {
    const key = extractClassName(path.basename(pdf, '.pdf'));
    const outputName = NAME_MAP[key];
    if (!outputName) {
      skipped.push(`  ⚠ "${pdf}" — classe inconnue (clé: "${key}"), ignoré`);
      continue;
    }
    await convertPdf(path.join(INPUT_DIR, pdf), outputName);
  }

  if (skipped.length) {
    console.log('\nFichiers ignorés (classe non reconnue) :');
    skipped.forEach(s => console.log(s));
  }

  console.log(`\n✅ Terminé ! PNG dans : ${OUTPUT_DIR}`);
  console.log('→ Uploade ces fichiers dans le bucket Supabase "classes"');
}

main().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
