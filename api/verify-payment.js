const c = require('../server/commerce.cjs');
module.exports = async (req, res) => {
  c.headers(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  try {
    if (!req.body?.sessionId) return res.status(400).json({ error: 'Référence manquante.' });
    const { stripe, db } = c.clients();
    const data = await c.receipt(stripe, req.body.sessionId);
    for (const item of data.items) {
      const product = await c.catalogItem(db, item.type, item.id);
      item.languages = Object.keys(product.files);
    }
    return res.status(200).json(data);
  } catch (error) { return c.errorResponse(res, error); }
};
