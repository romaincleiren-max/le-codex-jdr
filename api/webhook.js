// Webhook Stripe pour gérer les événements de paiement
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Pour vérifier les signatures Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async (req, res) => {
  // Seules les requêtes POST sont autorisées
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Erreur signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('✅ Paiement réussi:', session.id);
        
        // Ici vous pouvez :
        // 1. Enregistrer la commande dans Supabase
        // 2. Envoyer un email de confirmation
        // 3. Donner accès aux PDFs
        
        // Exemple : récupérer les détails
        const customerEmail = session.customer_email;
        const customerName = session.metadata?.customerName;
        const amount = session.amount_total / 100;
        
        console.log('📧 Email:', customerEmail);
        console.log('👤 Nom:', customerName);
        console.log('💰 Montant:', amount, 'EUR');
        
        // TODO: Enregistrer dans Supabase
        // await supabaseService.createOrder({
        //   email: customerEmail,
        //   name: customerName,
        //   amount: amount,
        //   stripeSessionId: session.id,
        //   status: 'paid'
        // });
        
        break;

      case 'checkout.session.async_payment_succeeded':
        console.log('✅ Paiement asynchrone réussi');
        break;

      case 'checkout.session.async_payment_failed':
        console.log('❌ Paiement asynchrone échoué');
        break;

      default:
        console.log(`⚠️ Événement non géré: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
