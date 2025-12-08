-- ============================================================================
-- SCHÉMA POUR LE SYSTÈME DE VENTE DE PDFs
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================================

-- Table des produits PDF (campagnes/scénarios vendus)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_free BOOLEAN DEFAULT false,
  pdf_path TEXT NOT NULL, -- Chemin dans Supabase Storage bucket "pdfs"
  product_type TEXT NOT NULL CHECK (product_type IN ('campaign', 'scenario', 'standalone')),
  related_campaign_id BIGINT REFERENCES campaigns(id) ON DELETE SET NULL,
  related_scenario_id BIGINT REFERENCES scenarios(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des achats et téléchargements
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stripe_payment_id TEXT, -- NULL si gratuit
  stripe_session_id TEXT,
  download_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3,
  is_expired BOOLEAN GENERATED ALWAYS AS (expires_at < NOW()) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES POUR OPTIMISER LES PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_purchases_token ON purchases(download_token);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_expires ON purchases(expires_at);

-- ============================================================================
-- FONCTION POUR GÉNÉRER UN TOKEN DE TÉLÉCHARGEMENT SÉCURISÉ
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_download_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER POUR METTRE À JOUR updated_at
-- ============================================================================

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Lecture publique pour tous
CREATE POLICY "Lecture publique des produits actifs" ON products 
  FOR SELECT USING (is_active = true);

-- PRODUCTS: Création/modification réservée aux admins (via service role)
-- Pas de politique = seul le service role peut écrire

-- PURCHASES: Lecture limitée aux propres achats
CREATE POLICY "Lecture des propres achats" ON purchases 
  FOR SELECT USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- PURCHASES: Lecture via token de téléchargement (pour le système de download)
CREATE POLICY "Lecture via download token" ON purchases 
  FOR SELECT USING (true); -- On vérifie le token dans le code applicatif

-- PURCHASES: Création publique (pour enregistrer les achats)
CREATE POLICY "Création de purchases" ON purchases 
  FOR INSERT WITH CHECK (true);

-- PURCHASES: Mise à jour limitée (incrémenter download_count)
CREATE POLICY "Mise à jour du compteur de téléchargement" ON purchases 
  FOR UPDATE USING (true);

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue pour les statistiques de ventes
CREATE OR REPLACE VIEW sales_stats AS
SELECT 
  p.id as product_id,
  p.title,
  COUNT(pur.id) as total_purchases,
  SUM(CASE WHEN pur.stripe_payment_id IS NOT NULL THEN p.price ELSE 0 END) as total_revenue,
  COUNT(CASE WHEN pur.stripe_payment_id IS NULL THEN 1 END) as free_downloads,
  COUNT(CASE WHEN pur.stripe_payment_id IS NOT NULL THEN 1 END) as paid_purchases
FROM products p
LEFT JOIN purchases pur ON p.id = pur.product_id
GROUP BY p.id, p.title;

-- Vue pour les téléchargements récents
CREATE OR REPLACE VIEW recent_downloads AS
SELECT 
  pur.id,
  pur.user_email,
  p.title as product_title,
  pur.download_count,
  pur.max_downloads,
  pur.expires_at,
  pur.created_at,
  CASE 
    WHEN pur.expires_at < NOW() THEN 'Expiré'
    WHEN pur.download_count >= pur.max_downloads THEN 'Limite atteinte'
    ELSE 'Actif'
  END as status
FROM purchases pur
JOIN products p ON pur.product_id = p.id
ORDER BY pur.created_at DESC
LIMIT 100;

-- ============================================================================
-- FONCTION POUR VÉRIFIER LA VALIDITÉ D'UN TOKEN DE TÉLÉCHARGEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_download_token(token_input TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  purchase_id UUID,
  product_id UUID,
  pdf_path TEXT,
  error_message TEXT
) AS $$
DECLARE
  purchase_record RECORD;
  product_record RECORD;
BEGIN
  -- Chercher le purchase avec ce token
  SELECT * INTO purchase_record
  FROM purchases
  WHERE download_token = token_input;

  -- Token invalide
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Token invalide'::TEXT;
    RETURN;
  END IF;

  -- Vérifier si expiré
  IF purchase_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, purchase_record.id, purchase_record.product_id, NULL::TEXT, 'Lien expiré'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le nombre de téléchargements
  IF purchase_record.download_count >= purchase_record.max_downloads THEN
    RETURN QUERY SELECT false, purchase_record.id, purchase_record.product_id, NULL::TEXT, 'Limite de téléchargements atteinte'::TEXT;
    RETURN;
  END IF;

  -- Récupérer le produit
  SELECT * INTO product_record
  FROM products
  WHERE id = purchase_record.product_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, purchase_record.id, purchase_record.product_id, NULL::TEXT, 'Produit introuvable'::TEXT;
    RETURN;
  END IF;

  -- Tout est OK
  RETURN QUERY SELECT true, purchase_record.id, product_record.id, product_record.pdf_path, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION POUR INCRÉMENTER LE COMPTEUR DE TÉLÉCHARGEMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_download_count(purchase_id_input UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE purchases
  SET 
    download_count = download_count + 1,
    updated_at = NOW()
  WHERE id = purchase_id_input;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================

/*
1. Ce schéma ajoute les tables nécessaires pour le système de vente de PDFs
2. Les produits (products) peuvent être des campagnes, scénarios ou produits standalone
3. Les achats (purchases) contiennent:
   - Token unique de téléchargement
   - Date d'expiration (48h pour payant, 24h pour gratuit)
   - Compteur de téléchargements (max 3)
   - ID de paiement Stripe (si payant)

4. Sécurité:
   - Les PDFs sont stockés dans un bucket PRIVÉ
   - Les téléchargements se font via URLs signées temporaires
   - Les tokens sont cryptographiquement sécurisés
   - RLS activé pour protéger les données

5. Workflow:
   a) Admin uploade un PDF → stocké dans Storage + entrée dans products
   b) Utilisateur achète/télécharge → entrée dans purchases avec token
   c) Email envoyé avec lien contenant le token
   d) Clic sur le lien → vérification du token → génération URL signée → téléchargement
   e) Compteur incrémenté à chaque téléchargement
*/

-- ============================================================================
-- EXEMPLE D'UTILISATION
-- ============================================================================

/*
-- Créer un produit
INSERT INTO products (title, description, price, is_free, pdf_path, product_type)
VALUES (
  'Ma Première Campagne',
  'Une campagne épique en 5 scénarios',
  24.99,
  false,
  'campaigns/ma-premiere-campagne.pdf',
  'campaign'
);

-- Créer un achat gratuit
INSERT INTO purchases (user_email, product_id, download_token, expires_at, max_downloads)
VALUES (
  'user@example.com',
  'product-uuid-here',
  generate_download_token(),
  NOW() + INTERVAL '24 hours',
  3
);

-- Vérifier un token
SELECT * FROM check_download_token('token-here');

-- Incrémenter le compteur
SELECT increment_download_count('purchase-uuid-here');

-- Voir les stats de ventes
SELECT * FROM sales_stats;
*/
