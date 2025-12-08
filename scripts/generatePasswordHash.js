/**
 * Script utilitaire pour générer des hash bcrypt de mots de passe
 * Usage: node scripts/generatePasswordHash.js [mot_de_passe]
 * 
 * Ce script est utilisé pour créer le hash du mot de passe admin
 * qui sera stocké dans la variable d'environnement VITE_ADMIN_PASSWORD_HASH
 */

import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateHash(password) {
  try {
    console.log('\n🔒 Génération du hash bcrypt...\n');
    
    // Génère un hash avec 10 rounds de salage
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('✅ Hash généré avec succès!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Copiez ce hash dans votre fichier .env:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`VITE_ADMIN_PASSWORD_HASH=${hash}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Vérifie que le hash fonctionne
    const isValid = await bcrypt.compare(password, hash);
    console.log(`🔍 Vérification du hash: ${isValid ? '✅ Valide' : '❌ Invalide'}\n`);
    
    console.log('⚠️  IMPORTANT:');
    console.log('   1. Ajoutez cette ligne dans votre fichier .env');
    console.log('   2. Ne partagez JAMAIS ce hash publiquement');
    console.log('   3. Ajoutez .env dans votre .gitignore');
    console.log('   4. Pour la production, configurez cette variable sur Vercel\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du hash:', error.message);
    process.exit(1);
  }
}

function askPassword() {
  rl.question('🔑 Entrez le mot de passe admin à hasher: ', (password) => {
    if (!password || password.trim().length === 0) {
      console.log('\n❌ Le mot de passe ne peut pas être vide.\n');
      askPassword();
      return;
    }
    
    if (password.length < 8) {
      console.log('\n⚠️  Attention: Le mot de passe est court (moins de 8 caractères).');
      rl.question('Continuer quand même? (o/n): ', (answer) => {
        if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'y') {
          generateHash(password).finally(() => {
            rl.close();
          });
        } else {
          console.log('\nOpération annulée.\n');
          askPassword();
        }
      });
    } else {
      generateHash(password).finally(() => {
        rl.close();
      });
    }
  });
}

// Point d'entrée du script
console.log('\n════════════════════════════════════════════════════════════');
console.log('  🔐 Générateur de Hash de Mot de Passe - Le Codex JDR');
console.log('════════════════════════════════════════════════════════════\n');

// Vérifie si un mot de passe a été fourni en argument
const password = process.argv[2];

if (password) {
  generateHash(password).finally(() => {
    process.exit(0);
  });
} else {
  // Mode interactif
  askPassword();
}
