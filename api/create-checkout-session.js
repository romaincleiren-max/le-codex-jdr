// API Serverless Vercel pour créer une session de paiement Stripe
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

  // Gérer la requête OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Vérifier que c'est une requête POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { cartItems, customerEmail, customerName } = req.body;

    // Valider les données
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Panier vide ou invalide' });
    }

    // customerEmail et customerName sont optionnels - Stripe les demandera si non fournis

    // Construire les line_items pour Stripe
    const lineItems = cartItems.map(item => {
      const isSaga = item.type === 'saga';
      const itemData = item.item;
      
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: isSaga ? `Campagne: ${itemData.name}` : `Scénario: ${itemData.displayName}`,
            description: isSaga 
              ? `${itemData.scenarios.length} scénarios inclus` 
              : `De la campagne: ${item.saga?.name || 'N/A'}`,
            metadata: {
              type: item.type,
              itemId: itemData.id,
              sagaId: isSaga ? itemData.id : item.saga?.id
            }
          },
          unit_amount: Math.round(itemData.price * 100) // Convertir en centimes
        },
        quantity: 1
      };
    });

    // Construire les options de session - Ne pas envoyer les champs vides
    const sessionOptions = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?canceled=true`,
    };

    // Ajouter customer_email seulement s'il est fourni
    if (customerEmail) {
      sessionOptions.customer_email = customerEmail;
    }

    // Ajouter metadata seulement si on a des données
    if (customerName || customerEmail) {
      sessionOptions.metadata = {
        orderType: 'pdf_scenarios'
      };
      if (customerName) sessionOptions.metadata.customerName = customerName;
      if (customerEmail) sessionOptions.metadata.customerEmail = customerEmail;
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create(sessionOptions);

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la session de paiement',
      details: error.message 
    });
  }
};
