// Webhook Stripe pour gérer les événements de paiement
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

        const customerEmail = session.customer_email;
        const customerName = session.metadata?.customerName;
        const amount = session.amount_total / 100;

        console.log('📧 Email:', customerEmail);
        console.log('👤 Nom:', customerName);
        console.log('💰 Montant:', amount, 'EUR');

        // Récupérer les line items pour savoir ce qui a été acheté
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        // Créer les purchases dans Supabase pour chaque produit
        for (const item of lineItems.data) {
          // Récupérer le product_id depuis les metadata du prix Stripe
          const stripeProduct = item.price?.product;

          if (!stripeProduct) {
            console.error('❌ Impossible de trouver le product_id pour:', item);
            continue;
          }

          // Récupérer les détails du produit Stripe pour obtenir le product_id Supabase
          const productDetails = await stripe.products.retrieve(stripeProduct);
          const productId = productDetails.metadata?.supabase_product_id;

          if (!productId) {
            console.error('❌ Metadata supabase_product_id manquant pour le produit Stripe:', stripeProduct);
            continue;
          }

          // Générer un token de téléchargement unique
          const downloadToken = crypto.randomBytes(32).toString('hex');

          // Calculer la date d'expiration (48h pour payant)
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);

          // Insérer dans la table purchases
          const { data: purchase, error: insertError } = await supabase
            .from('purchases')
            .insert({
              customer_email: customerEmail,
              customer_name: customerName,
              product_id: productId,
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              amount_paid: amount,
              download_token: downloadToken,
              expires_at: expiresAt.toISOString(),
              download_count: 0
            })
            .select()
            .single();

          if (insertError) {
            console.error('❌ Erreur création purchase:', insertError);
            continue;
          }

          console.log('✅ Purchase créé:', purchase.id, 'Token:', downloadToken);

          // Envoyer l'email de confirmation avec le lien de téléchargement
          try {
            await sendDownloadEmail({
              email: customerEmail,
              name: customerName,
              downloadToken: downloadToken,
              productName: item.description,
              expiresAt: expiresAt
            });
            console.log('✅ Email envoyé à:', customerEmail);
          } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
          }
        }

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

// Fonction pour envoyer l'email de téléchargement
async function sendDownloadEmail({ email, name, downloadToken, productName, expiresAt }) {
  const downloadLink = `${process.env.VITE_APP_URL || 'https://le-codex-jdr.vercel.app'}/download/${downloadToken}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #1e293b;
          color: #fef3c7;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
          border: 2px solid #d97706;
          border-radius: 16px;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #d97706;
          font-size: 32px;
          margin: 0;
        }
        .message-box {
          background: rgba(217, 119, 6, 0.1);
          border: 2px solid #d97706;
          border-radius: 12px;
          padding: 24px;
          margin: 30px 0;
        }
        .message-box h2 {
          color: #fbbf24;
          font-size: 20px;
          margin-top: 0;
          text-align: center;
        }
        .message-box p {
          line-height: 1.8;
          margin: 12px 0;
          text-align: center;
        }
        .message-box .highlight {
          color: #fbbf24;
          font-weight: bold;
        }
        .download-button {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 30px auto;
          padding: 16px 32px;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
          font-size: 18px;
        }
        .info {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Merci pour votre achat !</h1>
        </div>

        <p style="font-size: 18px;">Bonjour ${name || 'cher·e client·e'},</p>

        <p>Votre paiement a été confirmé avec succès ! Vous pouvez maintenant télécharger votre fichier :</p>

        <p style="text-align: center; font-size: 20px; color: #fbbf24; font-weight: bold; margin: 20px 0;">
          ${productName}
        </p>

        <div class="message-box">
          <h2>📜 Message important</h2>
          <p><strong>Ce fichier n'est pas protégé par DRM.</strong></p>
          <p>Il repose sur un principe simple : <span class="highlight">la confiance</span>.</p>
          <p>Si chacun partage ce qu'il achète, ce type de projet disparaît.</p>
          <p>Si chacun respecte le travail des créateurs, il peut continuer à exister.</p>
          <p style="font-size: 18px; margin-top: 16px;"><strong>Merci de votre soutien! 🙏</strong></p>
        </div>

        <a href="${downloadLink}" class="download-button">
          📥 Télécharger maintenant
        </a>

        <div class="info">
          <p style="margin: 0;"><strong>ℹ️ Informations importantes :</strong></p>
          <p style="margin: 8px 0;">• Ce lien est valable pendant <strong>48 heures</strong></p>
          <p style="margin: 8px 0;">• Vous pouvez télécharger le fichier <strong>jusqu'à 3 fois</strong></p>
          <p style="margin: 8px 0;">• Expire le : <strong>${new Date(expiresAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</strong></p>
        </div>

        <p style="margin-top: 30px;">Si vous rencontrez un problème, n'hésitez pas à nous contacter.</p>

        <p style="margin-top: 20px;">Bonne aventure ! ⚔️</p>

        <div class="footer">
          <p>Le Codex JDR</p>
          <p style="font-size: 12px; margin-top: 10px;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
            <span style="color: #3b82f6; word-break: break-all;">${downloadLink}</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Pour l'instant, on log l'email (à remplacer par un vrai service d'envoi)
  console.log('📧 EMAIL À ENVOYER:');
  console.log('To:', email);
  console.log('Subject: Votre téléchargement est prêt - Le Codex JDR');
  console.log('Download Link:', downloadLink);

  // TODO: Intégrer un service d'email (SendGrid, Resend, etc.)
  // Exemple avec Resend :
  // const { Resend } = require('resend');
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Le Codex JDR <noreply@le-codex-jdr.com>',
  //   to: email,
  //   subject: 'Votre téléchargement est prêt - Le Codex JDR',
  //   html: emailHtml
  // });

  return true;
}
