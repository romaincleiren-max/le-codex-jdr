-- ============================================================================
-- SCHÉMA DE BASE DE DONNÉES POUR LE CODEX
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- 1. Table des thèmes
CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  background_image TEXT,
  colors JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des campagnes
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT false,
  pdf_url TEXT,
  background_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des scénarios
CREATE TABLE IF NOT EXISTS scenarios (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  display_name TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  background_image_url TEXT,
  duration TEXT DEFAULT '4-6 heures',
  price DECIMAL(10,2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT false,
  pdf_url TEXT,
  ratings JSONB NOT NULL DEFAULT '{"ambiance": 3, "complexite": 3, "combat": 3, "enquete": 3}',
  tags TEXT[] DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des paramètres du site
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'Le Codex',
  logo_url TEXT,
  tagline TEXT DEFAULT 'Bibliothèque de scénarios JDR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 5. Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des items de commande
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('campaign', 'scenario')),
  item_id BIGINT NOT NULL,
  item_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table des soumissions de scénarios
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_name TEXT NOT NULL,
  author TEXT NOT NULL,
  email TEXT NOT NULL,
  summary TEXT NOT NULL,
  pdf_filename TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES POUR OPTIMISER LES PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_theme ON campaigns(theme_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_campaign ON scenarios(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);

-- ============================================================================
-- FONCTION DE MISE À JOUR AUTOMATIQUE DU TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

-- Insertion des thèmes par défaut (couleurs corrigées - medieval et lovecraft échangées)
INSERT INTO themes (id, name, background_image, colors) VALUES
  ('medieval', 'Médiéval Fantasy', 'https://i.imgur.com/VQM3KJm.jpeg', 
   '{"bg": "bg-slate-900", "primary": "bg-emerald-900", "text": "text-emerald-100", "textLight": "text-emerald-300", "card": "bg-slate-800", "hover": "hover:bg-emerald-800", "starFilled": "text-emerald-400", "starEmpty": "text-slate-600", "tag": "bg-emerald-900 text-emerald-300"}'),
  ('lovecraft', 'Horreur Lovecraftienne', 'https://i.imgur.com/8yZqQJ7.jpeg',
   '{"bg": "bg-amber-50", "primary": "bg-amber-800", "text": "text-amber-900", "textLight": "text-amber-700", "card": "bg-amber-100", "hover": "hover:bg-amber-700", "starFilled": "text-yellow-600", "starEmpty": "text-gray-400", "tag": "bg-amber-200 text-amber-800"}'),
  ('scifi', 'Science-Fiction', 'https://i.imgur.com/m3rWsXP.jpeg',
   '{"bg": "bg-slate-950", "primary": "bg-cyan-900", "text": "text-cyan-100", "textLight": "text-cyan-300", "card": "bg-slate-900", "hover": "hover:bg-cyan-800", "starFilled": "text-cyan-400", "starEmpty": "text-slate-700", "tag": "bg-cyan-900 text-cyan-300"}')
ON CONFLICT (id) DO NOTHING;

-- Insertion des paramètres du site par défaut
INSERT INTO site_settings (id, site_name, tagline) VALUES
  (1, 'Le Codex', 'Bibliothèque de scénarios JDR')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Politiques publiques en lecture pour le contenu
CREATE POLICY "Lecture publique des thèmes" ON themes FOR SELECT USING (true);
CREATE POLICY "Lecture publique des campagnes" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Lecture publique des scénarios" ON scenarios FOR SELECT USING (true);
CREATE POLICY "Lecture publique des paramètres" ON site_settings FOR SELECT USING (true);

-- Politiques pour les commandes (seulement leurs propres commandes)
CREATE POLICY "Lecture des propres commandes" ON orders FOR SELECT 
  USING (customer_email = auth.jwt()->>'email');

CREATE POLICY "Création de commandes" ON orders FOR INSERT 
  WITH CHECK (true);

-- Politiques pour les items de commande
CREATE POLICY "Lecture des propres items" ON order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Création d'items de commande" ON order_items FOR INSERT 
  WITH CHECK (true);

-- Politiques pour les soumissions
-- Tout le monde peut soumettre un scénario
CREATE POLICY "Création de soumissions" ON submissions FOR INSERT 
  WITH CHECK (true);

-- Tout le monde peut lire les soumissions (à restreindre aux admins plus tard)
CREATE POLICY "Lecture des soumissions" ON submissions FOR SELECT 
  USING (true);

-- Tout le monde peut modifier les soumissions (à restreindre aux admins plus tard)
CREATE POLICY "Modification des soumissions" ON submissions FOR UPDATE 
  USING (true);

-- Tout le monde peut supprimer les soumissions (à restreindre aux admins plus tard)
CREATE POLICY "Suppression des soumissions" ON submissions FOR DELETE 
  USING (true);

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

-- 1. Copiez tout ce code
-- 2. Allez dans Supabase > SQL Editor
-- 3. Collez et exécutez le code
-- 4. Vérifiez que toutes les tables sont créées dans Table Editor

-- Pour réinitialiser complètement la base de données (DANGER!) :
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS scenarios CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;
-- DROP TABLE IF EXISTS themes CASCADE;
-- DROP TABLE IF EXISTS site_settings CASCADE;
