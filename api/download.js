module.exports = (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'Ancien lien : contactez le support avec votre référence d’achat pour retrouver votre PDF.' });
};