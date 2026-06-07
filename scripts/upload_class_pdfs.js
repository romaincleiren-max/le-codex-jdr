/**
 * Upload des PDFs d'icônes de classes vers le bucket Supabase "classes"
 * Usage : npm run upload-class-pdfs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger .env
try { fs.readFileSync(path.join(__dirname,'../.env'),'utf8').split('\n').forEach(l=>{const[k,...v]=l.split('=');if(k&&v.length)process.env[k.trim()]=v.join('=').trim();}); } catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Manque VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const PDF_DIR  = path.join(__dirname, '../data/class-pdfs');
const BUCKET   = 'classes';

const NAME_MAP = {
  'barbarian':  'Classe - Barbare.pdf',
  'bard':       'Classe - Barde.pdf',
  'cleric':     'Classe - Clerc.pdf',
  'druid':      'Classe - Druide.pdf',
  'fighter':    'Classe - Guerrier.pdf',
  'monk':       'Classe - Moine.pdf',
  'paladin':    'Classe - Paladin.pdf',
  'ranger':     'Classe - Rodeur.pdf',
  'rogue':      'Classe - Roublard.pdf',
  'sorcerer':   'Classe - Ensorceleur.pdf',
  'warlock':    'Classe - Occultiste.pdf',
  'wizard':     'Classe - Magicien.pdf',
};

function extractClassName(basename) {
  const m = basename.match(/class\s+icon\s*[-–]\s*(.+?)(?:\s*\(\d+\))?$/i);
  return m ? m[1].trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : basename.toLowerCase();
}

async function main() {
  if (!fs.existsSync(PDF_DIR)) {
    console.error('Dossier introuvable :', PDF_DIR);
    process.exit(1);
  }

  const pdfs = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) { console.log('Aucun PDF trouvé dans', PDF_DIR); return; }

  console.log(`\nUpload de ${pdfs.length} PDF vers bucket "${BUCKET}"...\n`);

  let ok = 0, ko = 0, skip = 0;
  for (const pdf of pdfs) {
    const key = extractClassName(path.basename(pdf, '.pdf'));
    const dest = NAME_MAP[key];
    if (!dest) { console.log(`  ⚠ Ignoré : ${pdf} (classe inconnue)`); skip++; continue; }

    const buffer = fs.readFileSync(path.join(PDF_DIR, pdf));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(dest, buffer, { contentType: 'application/pdf', upsert: true });

    if (error) {
      console.error(`  ✗ ${dest} — ${error.message}`);
      if (error.message.includes('mime')) {
        console.error('\n  → Le bucket n\'accepte pas les PDFs. Exécute dans Supabase SQL Editor :');
        console.error('    UPDATE storage.buckets SET allowed_mime_types = allowed_mime_types || ARRAY[\'application/pdf\'] WHERE id = \'classes\';');
      }
      ko++;
    } else {
      console.log(`  ✓ ${dest}`);
      ok++;
    }
  }

  console.log(`\n${ok} uploadé(s)${ko ? `, ${ko} erreur(s)` : ''}${skip ? `, ${skip} ignoré(s)` : ''}`);
}

main().catch(err => { console.error('Erreur :', err.message); process.exit(1); });
