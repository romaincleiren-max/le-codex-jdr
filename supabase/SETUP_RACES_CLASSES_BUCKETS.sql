-- ═══════════════════════════════════════════════════════════
-- Création des buckets "races" et "classes" — Forge du Héros
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Créer le bucket "races" (public)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'races', 'races', true,
  ARRAY['image/jpeg','image/png','image/webp'],
  5242880  -- 5 MB max
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Créer le bucket "classes" (public)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'classes', 'classes', true,
  ARRAY['image/jpeg','image/png','image/webp'],
  5242880
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policies : lecture publique (SELECT)
CREATE POLICY IF NOT EXISTS "Public read races"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'races');

CREATE POLICY IF NOT EXISTS "Public read classes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'classes');

-- 4. Policies : upload (INSERT) — anon + authenticated
CREATE POLICY IF NOT EXISTS "Upload races"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'races');

CREATE POLICY IF NOT EXISTS "Upload classes"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'classes');

-- ═══════════════════════════════════════════════════════════
-- NOMS DE FICHIERS ATTENDUS (format : <id>.jpg ou <id>.webp)
-- La Forge essaie .jpg d'abord, puis .webp, puis icône emoji
-- ═══════════════════════════════════════════════════════════

-- ── Races (31 fichiers) ──────────────────────────────────
-- races/aarakocra.jpg
-- races/aasimar-fallen.jpg
-- races/aasimar-protector.jpg
-- races/aasimar-scourge.jpg
-- races/dragonborn.jpg
-- races/dwarf-hill.jpg
-- races/dwarf-mountain.jpg
-- races/elf-drow.jpg
-- races/elf-high.jpg
-- races/elf-wood.jpg
-- races/genasi-air.jpg
-- races/genasi-earth.jpg
-- races/genasi-fire.jpg
-- races/genasi-water.jpg
-- races/gnome-forest.jpg
-- races/gnome-rock.jpg
-- races/goliath.jpg
-- races/half-elf.jpg
-- races/half-orc.jpg
-- races/halfling-lf.jpg       ← Halfelin pied-léger
-- races/halfling-stout.jpg    ← Halfelin robuste
-- races/human.jpg
-- races/tiefling.jpg
-- races/tiefling-baalzebul.jpg
-- races/tiefling-dispater.jpg
-- races/tiefling-fierna.jpg
-- races/tiefling-glasya.jpg
-- races/tiefling-levistus.jpg
-- races/tiefling-mammon.jpg
-- races/tiefling-mephistopheles.jpg
-- races/tiefling-zariel.jpg

-- ── Classes (12 fichiers) ────────────────────────────────
-- classes/barbarian.jpg
-- classes/bard.jpg
-- classes/cleric.jpg
-- classes/druid.jpg
-- classes/fighter.jpg
-- classes/monk.jpg
-- classes/paladin.jpg
-- classes/ranger.jpg
-- classes/rogue.jpg
-- classes/sorcerer.jpg
-- classes/warlock.jpg
-- classes/wizard.jpg
