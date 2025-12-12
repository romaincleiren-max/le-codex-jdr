// API Serverless Vercel pour vérifier le statut d'un paiement Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requis' });
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Récupérer les line items pour savoir ce qui a été acheté
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

      res.status(200).json({
        success: true,
        paid: true,
        customerEmail: session.customer_email,
        customerName: session.metadata?.customerName,
        amount: session.amount_total / 100,
        currency: session.currency,
        items: lineItems.data,
        paymentIntent: session.payment_intent
      });
    } else {
      res.status(200).json({
        success: false,
        paid: false,
        status: session.payment_status
      });
    }

  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification du paiement',
      details: error.message 
    });
  }
};
