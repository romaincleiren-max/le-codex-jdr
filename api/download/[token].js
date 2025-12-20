// API pour générer un lien de téléchargement sécurisé avec un token
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Seules les requêtes GET sont autorisées
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    // Vérifier le token et récupérer les informations d'achat
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        *,
        products (
          file_path,
          name
        )
      `)
      .eq('download_token', token)
      .single();

    if (purchaseError || !purchase) {
      console.error('❌ Token invalide:', purchaseError);
      return res.status(404).json({ error: 'Token invalide ou expiré' });
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(purchase.expires_at);

    if (now > expiresAt) {
      return res.status(410).json({ error: 'Le lien de téléchargement a expiré' });
    }

    // Vérifier le quota de téléchargements
    if (purchase.download_count >= 3) {
      return res.status(403).json({ error: 'Limite de téléchargements atteinte (3 max)' });
    }

    // Générer une URL signée temporaire (5 minutes)
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(purchase.products.file_path, 300); // 300 secondes = 5 minutes

    if (signedError || !signedUrl) {
      console.error('❌ Erreur génération URL signée:', signedError);
      return res.status(500).json({ error: 'Erreur lors de la génération du lien de téléchargement' });
    }

    // Incrémenter le compteur de téléchargements
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        download_count: purchase.download_count + 1,
        last_download_at: new Date().toISOString()
      })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('⚠️ Erreur mise à jour compteur:', updateError);
    }

    // Retourner l'URL signée
    res.status(200).json({
      downloadUrl: signedUrl.signedUrl,
      fileName: purchase.products.name,
      remainingDownloads: 3 - (purchase.download_count + 1),
      expiresAt: purchase.expires_at
    });

  } catch (error) {
    console.error('❌ Erreur API download:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
