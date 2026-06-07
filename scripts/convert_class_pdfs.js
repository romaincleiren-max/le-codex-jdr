/**
 * Convertit les PDF d'icônes de classes en PNG pour le bucket Supabase "classes"
 *
 * Usage :
 *   1. Mets tes PDF dans data/class-pdfs/
 *   2. npm run convert-classes
 *   3. Uploade les PNG depuis data/class-icons/ vers le bucket Supabase "classes"
 *
 * Nommage des PDF :
 *   - Le script reconnait les noms en français et anglais (barbare, barbarian, guerrier, fighter, etc.)
 *   - Sinon il garde le nom d'origine
 */

const { pdfToPng } = require('pdf-to-png-converter');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR  = path.join(__dirname, '../data/class-pdfs');
const OUTPUT_DIR = path.join(__dirname, '../data/class-icons');

// Correspondance nom PDF (minuscules sans accents) → nom fichier Supabase
const NAME_MAP = {
  // Français
  'barbare':      'Classe - Barbare.png',
  'barde':        'Classe - Barde.png',
  'clerc':        'Classe - Clerc.png',
  'druide':       'Classe - Druide.png',
  'guerrier':     'Classe - Guerrier.png',
  'moine':        'Classe - Moine.png',
  'paladin':      'Classe - Paladin.png',
  'rodeur':       'Classe - Rodeur.png',
  'roublard':     'Classe - Roublard.png',
  'ensorceleur':  'Classe - Ensorceleur.png',
  'occultiste':   'Classe - Occultiste.png',
  'magicien':     'Classe - Magicien.png',
  // Anglais
  'barbarian':    'Classe - Barbare.png',
  'bard':         'Classe - Barde.png',
  'cleric':       'Classe - Clerc.png',
  'druid':        'Classe - Druide.png',
  'fighter':      'Classe - Guerrier.png',
  'monk':         'Classe - Moine.png',
  'ranger':       'Classe - Rodeur.png',
  'rogue':        'Classe - Roublard.png',
  'sorcerer':     'Classe - Ensorceleur.png',
  'warlock':      'Classe - Occultiste.png',
  'wizard':       'Classe - Magicien.png',
};

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève accents
    .replace(/[^a-z]/g, ''); // garde seulement les lettres
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
      pixels[i+3] = 0; // transparent
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
  .png()
  .toBuffer();
}

async function convertPdf(pdfPath, outputName) {
  console.log(`  Conversion : ${path.basename(pdfPath)} → ${outputName}`);

  const pages = await pdfToPng(pdfPath, {
    disableFontFace:   false,
    useSystemFonts:    true,
    viewportScale:     4.0, // haute résolution (4× = ~1200px pour un PDF A4)
    pagesToProcess:    [1], // seulement la première page
    strictPagesToProcess: false,
    verbosityLevel:    0,
  });

  if (!pages.length) {
    console.error(`  ✗ Aucune page extraite pour ${path.basename(pdfPath)}`);
    return;
  }

  const pngBuffer = pages[0].content;

  // Tenter de détecter si le fond est blanc
  const { dominant } = await sharp(pngBuffer).stats();
  const isLikelyWhiteBg = dominant.r > 230 && dominant.g > 230 && dominant.b > 230;

  let finalBuffer;
  if (isLikelyWhiteBg) {
    console.log(`    → Fond blanc détecté, suppression...`);
    finalBuffer = await removeWhiteBackground(pngBuffer);
  } else {
    finalBuffer = await sharp(pngBuffer).png().toBuffer();
    console.log(`    → Fond transparent ou coloré conservé`);
  }

  // Recadrer pour supprimer les marges vides
  finalBuffer = await sharp(finalBuffer).trim({ threshold: 10 }).toBuffer();

  const outPath = path.join(OUTPUT_DIR, outputName);
  fs.writeFileSync(outPath, finalBuffer);
  console.log(`  ✓ Sauvegardé : ${outPath}`);
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log(`Dossier créé : ${INPUT_DIR}`);
    console.log('Mets tes PDF dedans puis relance le script.');
    return;
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const pdfs = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) {
    console.log(`Aucun PDF trouvé dans ${INPUT_DIR}`);
    return;
  }

  console.log(`\n${pdfs.length} PDF trouvé(s) dans ${INPUT_DIR}\n`);

  for (const pdf of pdfs) {
    const base = normalize(path.basename(pdf, '.pdf'));
    const outputName = NAME_MAP[base] || `Classe - ${path.basename(pdf, '.pdf')}.png`;
    await convertPdf(path.join(INPUT_DIR, pdf), outputName);
  }

  console.log(`\n✅ Terminé ! PNG dans : ${OUTPUT_DIR}`);
  console.log('→ Uploade ces fichiers dans le bucket Supabase "classes"');
}

main().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
