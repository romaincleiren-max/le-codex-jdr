-- ============================================================================
-- CORRECTION DE L'INVERSION DES COULEURS
-- Médiéval Fantasy et Horreur Lovecraftienne ont les couleurs inversées
-- ============================================================================

-- Échanger les couleurs entre medieval et lovecraft

-- Médiéval Fantasy devrait avoir des couleurs sombres/émeraude (comme lovecraft actuellement)
UPDATE themes
SET colors = '{"bg": "bg-slate-900", "primary": "bg-emerald-900", "text": "text-emerald-100", "textLight": "text-emerald-300", "card": "bg-slate-800", "hover": "hover:bg-emerald-800", "starFilled": "text-emerald-400", "starEmpty": "text-slate-600", "tag": "bg-emerald-900 text-emerald-300"}'::jsonb
WHERE id = 'medieval';

-- Horreur Lovecraftienne devrait avoir des couleurs ambrées/dorées (comme medieval actuellement)
UPDATE themes
SET colors = '{"bg": "bg-amber-50", "primary": "bg-amber-800", "text": "text-amber-900", "textLight": "text-amber-700", "card": "bg-amber-100", "hover": "hover:bg-amber-700", "starFilled": "text-yellow-600", "starEmpty": "text-gray-400", "tag": "bg-amber-200 text-amber-800"}'::jsonb
WHERE id = 'lovecraft';

-- Vérifier le résultat
SELECT id, name, colors FROM themes;
