-- ============================================================================
-- TABLE game_systems — Systèmes de jeu configurables depuis l'admin
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  color TEXT DEFAULT '#C9A84C',
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

ALTER TABLE public.game_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read game_systems"
  ON public.game_systems FOR SELECT USING (true);

CREATE POLICY "Admin write game_systems"
  ON public.game_systems FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = (auth.jwt()->>'email')
  ));

-- Données initiales
INSERT INTO public.game_systems (id, name, subtitle, description, color, sort_order) VALUES
  ('dnd5e',       'D&D 5e',          'Donjons & Dragons 5ème Édition', 'Le système fantasy le plus populaire. Races, classes, sorts et épopées héroïques.', '#C9A84C', 1),
  ('dark_heresy',  'Dark Heresy',     'Warhammer 40,000',               'Servez l''Imperium dans les ombres du 41ème millénaire. Enquêtes, hérésies et guerres stellaires.', '#8B0000', 2),
  ('cthulhu7',     'Call of Cthulhu', '7ème Édition',                   'Plongez dans l''horreur cosmique de Lovecraft. Santé mentale, occulte et terreurs indicibles.', '#2A6A4A', 3)
ON CONFLICT (id) DO NOTHING;
