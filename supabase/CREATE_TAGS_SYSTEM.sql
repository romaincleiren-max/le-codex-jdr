-- ============================================================================
-- SYSTÈME DE TAGS STRUCTURÉ POUR LE CODEX
-- ============================================================================

-- Table des tags prédéfinis
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(30) NOT NULL, -- Genre, Ambiance, Difficulté, Durée, Type
  color VARCHAR(7) DEFAULT '#d97706', -- Couleur hex pour l'affichage
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Table de liaison many-to-many entre scénarios et tags
CREATE TABLE IF NOT EXISTS scenario_tags (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scenario_id, tag_id) -- Un scénario ne peut avoir le même tag qu'une fois
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_scenario_tags_scenario ON scenario_tags(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_tags_tag ON scenario_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(is_active);

-- ============================================================================
-- TAGS PRÉDÉFINIS PAR CATÉGORIE
-- ============================================================================

-- Catégorie: Genre
INSERT INTO tags (name, category, color) VALUES
  ('Horreur', 'Genre', '#dc2626'),
  ('Enquête', 'Genre', '#2563eb'),
  ('Combat', 'Genre', '#dc2626'),
  ('Exploration', 'Genre', '#059669'),
  ('Social', 'Genre', '#7c3aed'),
  ('Mystère', 'Genre', '#7c3aed'),
  ('Survival', 'Genre', '#ea580c'),
  ('Intrigue Politique', 'Genre', '#4f46e5')
ON CONFLICT (name) DO NOTHING;

-- Catégorie: Ambiance
INSERT INTO tags (name, category, color) VALUES
  ('Sombre', 'Ambiance', '#1f2937'),
  ('Épique', 'Ambiance', '#eab308'),
  ('Angoissante', 'Ambiance', '#7f1d1d'),
  ('Légère', 'Ambiance', '#86efac'),
  ('Mystique', 'Ambiance', '#6366f1'),
  ('Dramatique', 'Ambiance', '#dc2626'),
  ('Humoristique', 'Ambiance', '#f59e0b')
ON CONFLICT (name) DO NOTHING;

-- Catégorie: Difficulté
INSERT INTO tags (name, category, color) VALUES
  ('Débutant', 'Difficulté', '#22c55e'),
  ('Intermédiaire', 'Difficulté', '#f59e0b'),
  ('Avancé', 'Difficulté', '#dc2626'),
  ('Expert', 'Difficulté', '#7f1d1d')
ON CONFLICT (name) DO NOTHING;

-- Catégorie: Durée
INSERT INTO tags (name, category, color) VALUES
  ('One-Shot', 'Durée', '#10b981'),
  ('Courte (1-3h)', 'Durée', '#06b6d4'),
  ('Moyenne (4-6h)', 'Durée', '#f59e0b'),
  ('Longue (7h+)', 'Durée', '#dc2626'),
  ('Campagne', 'Durée', '#7c3aed')
ON CONFLICT (name) DO NOTHING;

-- Catégorie: Type
INSERT INTO tags (name, category, color) VALUES
  ('Urbain', 'Type', '#64748b'),
  ('Dungeon', 'Type', '#78350f'),
  ('Wilderness', 'Type', '#16a34a'),
  ('Mer/Océan', 'Type', '#0284c7'),
  ('Espace', 'Type', '#1e1b4b'),
  ('Plan Extraplanaire', 'Type', '#7c3aed'),
  ('Village', 'Type', '#92400e'),
  ('Château', 'Type', '#78350f')
ON CONFLICT (name) DO NOTHING;

-- Catégorie: Thème
INSERT INTO tags (name, category, color) VALUES
  ('Lovecraftien', 'Thème', '#065f46'),
  ('Fantastique Médiéval', 'Thème', '#92400e'),
  ('Cyberpunk', 'Thème', '#06b6d4'),
  ('Post-Apocalyptique', 'Thème', '#78350f'),
  ('Steampunk', 'Thème', '#78350f'),
  ('Pirates', 'Thème', '#0284c7'),
  ('Vampires', 'Thème', '#7f1d1d'),
  ('Dragons', 'Thème', '#dc2626')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_tags ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les tags
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- Seuls les admins peuvent modifier les tags
CREATE POLICY "Only admins can insert tags" ON tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Only admins can update tags" ON tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Only admins can delete tags" ON tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- Tout le monde peut voir les associations scénario-tags
CREATE POLICY "Scenario tags are viewable by everyone" ON scenario_tags
  FOR SELECT USING (true);

-- Seuls les admins peuvent modifier les associations
CREATE POLICY "Only admins can manage scenario tags" ON scenario_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue pour obtenir les tags d'un scénario avec leurs infos complètes
CREATE OR REPLACE VIEW scenario_tags_detailed AS
SELECT 
  st.scenario_id,
  t.id as tag_id,
  t.name,
  t.category,
  t.color,
  t.description
FROM scenario_tags st
JOIN tags t ON st.tag_id = t.id
WHERE t.is_active = true
ORDER BY t.category, t.name;

-- Vue pour compter les scénarios par tag
CREATE OR REPLACE VIEW tag_usage_stats AS
SELECT 
  t.id,
  t.name,
  t.category,
  COUNT(st.scenario_id) as scenario_count
FROM tags t
LEFT JOIN scenario_tags st ON t.id = st.tag_id
WHERE t.is_active = true
GROUP BY t.id, t.name, t.category
ORDER BY scenario_count DESC, t.category, t.name;

-- ============================================================================
-- FONCTIONS UTILES
-- ============================================================================

-- Fonction pour obtenir les tags d'un scénario sous forme de tableau
CREATE OR REPLACE FUNCTION get_scenario_tags(p_scenario_id INTEGER)
RETURNS TABLE (
  tag_id INTEGER,
  tag_name VARCHAR(50),
  category VARCHAR(30),
  color VARCHAR(7)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.category,
    t.color
  FROM scenario_tags st
  JOIN tags t ON st.tag_id = t.id
  WHERE st.scenario_id = p_scenario_id
    AND t.is_active = true
  ORDER BY t.category, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour assigner plusieurs tags à un scénario
CREATE OR REPLACE FUNCTION set_scenario_tags(
  p_scenario_id INTEGER,
  p_tag_ids INTEGER[]
) RETURNS void AS $$
BEGIN
  -- Supprimer tous les tags existants du scénario
  DELETE FROM scenario_tags WHERE scenario_id = p_scenario_id;
  
  -- Ajouter les nouveaux tags
  IF array_length(p_tag_ids, 1) > 0 THEN
    INSERT INTO scenario_tags (scenario_id, tag_id)
    SELECT p_scenario_id, unnest(p_tag_ids);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION DES TAGS EXISTANTS (si nécessaire)
-- ============================================================================

-- Cette fonction peut être utilisée pour migrer les anciens tags textuels
-- vers le nouveau système structuré
CREATE OR REPLACE FUNCTION migrate_text_tags_to_structured()
RETURNS void AS $$
DECLARE
  scenario_record RECORD;
  tag_text TEXT;
  tag_record RECORD;
BEGIN
  -- Pour chaque scénario avec des tags textuels
  FOR scenario_record IN 
    SELECT id, tags FROM scenarios WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    -- Pour chaque tag textuel
    FOREACH tag_text IN ARRAY scenario_record.tags
    LOOP
      -- Chercher si le tag existe déjà
      SELECT id INTO tag_record FROM tags WHERE LOWER(name) = LOWER(tag_text);
      
      -- Si le tag existe, l'associer au scénario
      IF FOUND THEN
        INSERT INTO scenario_tags (scenario_id, tag_id)
        VALUES (scenario_record.id, tag_record.id)
        ON CONFLICT (scenario_id, tag_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE tags IS 'Tags prédéfinis pour catégoriser les scénarios';
COMMENT ON TABLE scenario_tags IS 'Association many-to-many entre scénarios et tags';
COMMENT ON COLUMN tags.category IS 'Catégorie du tag: Genre, Ambiance, Difficulté, Durée, Type, Thème';
COMMENT ON COLUMN tags.color IS 'Couleur hex pour affichage dans l''interface';
COMMENT ON COLUMN tags.is_active IS 'Permet de désactiver un tag sans le supprimer';
