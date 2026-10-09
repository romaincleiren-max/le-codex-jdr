const c = require('../server/commerce.cjs');
module.exports = async (req, res) => {
  c.headers(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  try {
    const { type, id, language, sessionId } = req.body || {};
    c.key(type, id);
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(language || '')) throw c.fail(400, 'Choisissez une langue.');
    const db = c.database(); const item = await c.catalogItem(db, type, id);
    if (!item.is_free) {
      const { stripe } = c.clients(); const data = await c.receipt(stripe, sessionId);
      if (!data.paid || !data.items.some(i => i.type === type && String(i.id) === String(id))) throw c.fail(403, 'Achat requis pour ce PDF.');
    }
    return res.status(200).json({ downloadUrl: await c.signedFile(db, item, language) });
  } catch (error) { return c.errorResponse(res, error); }
};