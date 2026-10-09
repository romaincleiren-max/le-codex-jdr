const c = require('../server/commerce.cjs');
module.exports = async (req, res) => {
  c.headers(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  try {
    const body = req.body || {};
    if (!Array.isArray(body.cartItems) || !body.cartItems.length) throw c.fail(400, 'Panier vide.');
    if (req.headers.origin && req.headers.origin !== c.origin()) throw c.fail(403, 'Origine non autorisée.');
    if (process.env.PAYMENTS_ENABLED !== 'true') throw c.fail(503, 'Les achats seront bientôt disponibles. Les PDF gratuits restent accessibles.');
    c.env('STRIPE_WEBHOOK_SECRET'); c.env('RESEND_API_KEY'); c.env('RECEIPT_FROM_EMAIL');
    const { stripe, db } = c.clients();
    const line_items = await c.checkoutLines(db, body.cartItems);
    const options = { mode: 'payment', payment_method_types: ['card'], line_items, metadata: { codex_version: '2' }, success_url: c.origin() + '/payment/success?session_id={CHECKOUT_SESSION_ID}', cancel_url: c.origin() + '/?canceled=true' };
    if (body.customerEmail) {
      if (typeof body.customerEmail !== 'string' || body.customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail.trim())) throw c.fail(400, 'Adresse e-mail invalide.');
      options.customer_email = body.customerEmail.trim();
    }
    if (!/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw c.fail(400, 'Identifiant de requête manquant.');
    const digest = c.crypto.createHash('sha256').update(JSON.stringify(options)).digest('hex');
    const session = await stripe.checkout.sessions.create(options, { idempotencyKey: 'codex-' + body.requestId + '-' + digest });
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) { return c.errorResponse(res, error); }
};
