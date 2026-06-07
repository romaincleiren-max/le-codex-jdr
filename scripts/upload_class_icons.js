/**
 * Upload des icônes de classes vers le bucket Supabase "classes"
 * Usage : npm run upload-classes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../data/class-icons');
const BUCKET    = 'classes';

// Charger .env si disponible
try { require('fs').readFileSync(require('path').join(__dirname,'../.env'),'utf8').split('\n').forEach(l=>{const[k,...v]=l.split('=');if(k&&v.length)process.env[k.trim()]=v.join('=').trim();}); } catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Manque VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function uploadFile(filePath, fileName) {
  const buffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error(`  ✗ ${fileName} — ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${fileName}`);
  return true;
}

async function main() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Dossier introuvable : ${ICONS_DIR}`);
    console.error('Lance d\'abord : npm run convert-classes');
    process.exit(1);
  }

  const pngs = fs.readdirSync(ICONS_DIR).filter(f => f.toLowerCase().endsWith('.png'));
  if (!pngs.length) {
    console.log('Aucun PNG trouvé dans', ICONS_DIR);
    return;
  }

  console.log(`\nUpload de ${pngs.length} fichier(s) vers bucket "${BUCKET}"...\n`);

  let ok = 0, ko = 0;
  for (const png of pngs) {
    const success = await uploadFile(path.join(ICONS_DIR, png), png);
    success ? ok++ : ko++;
  }

  console.log(`\n${ok} uploadé(s)${ko ? `, ${ko} erreur(s)` : ''}`);
  if (ok) console.log(`→ Visible sur : ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);
}

main().catch(err => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
