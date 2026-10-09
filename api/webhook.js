const c = require('../server/commerce.cjs');
module.exports = async (req, res) => {
  c.headers(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  if (!req.headers['stripe-signature']) return res.status(400).json({ error: 'Signature manquante.' });
  try {
    const { stripe } = c.clients();
    const secret = c.env('STRIPE_WEBHOOK_SECRET');
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 1048576) throw c.fail(413, 'Requête trop volumineuse.'); chunks.push(Buffer.from(chunk)); }
    let event;
    try { event = stripe.webhooks.constructEvent(Buffer.concat(chunks), req.headers['stripe-signature'], secret); }
    catch { throw c.fail(400, 'Signature invalide.'); }
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      const session = event.data.object;
      if (session.metadata?.codex_version !== '2') throw c.fail(409, 'Ancienne commande : intervention requise.');
      const data = await c.receipt(stripe, session.id);
      if (data.paid) await c.sendReceipt(session.id, data);
    }
    return res.status(200).json({ received: true });
  } catch (error) { return c.errorResponse(res, error); }
};
module.exports.config = { api: { bodyParser: false } };