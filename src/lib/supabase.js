// Configuration du client Supabase
import { createClient } from '@supabase/supabase-js';

// Nettoyer les variables d'environnement en supprimant les espaces/retours à la ligne
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes. Vérifiez votre fichier .env');
}

// Vérifier que les valeurs ne contiennent pas de retours à la ligne
if (supabaseUrl.includes('\n') || supabaseUrl.includes('\r')) {
  throw new Error('VITE_SUPABASE_URL contient des retours à la ligne invalides');
}

if (supabaseAnonKey.includes('\n') || supabaseAnonKey.includes('\r')) {
  throw new Error('VITE_SUPABASE_ANON_KEY contient des retours à la ligne invalides');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseAnonKey.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
