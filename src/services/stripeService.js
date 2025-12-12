// Service Stripe pour gérer les paiements
import { loadStripe } from '@stripe/stripe-js';

// Initialiser Stripe avec la clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Créer une session de paiement Stripe Checkout
 * @param {Array} cartItems - Articles du panier
 * @param {Object} customerInfo - Informations client
 * @returns {Promise<Object>} - URL de redirection Stripe
 */
export const createCheckoutSession = async (cartItems, customerInfo) => {
  try {
    const { firstName, lastName, email } = customerInfo;

    // Appeler l'API serverless pour créer la session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartItems,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création de la session');
    }

    const { sessionId, url } = await response.json();

    return { sessionId, url, success: true };

  } catch (error) {
    console.error('❌ Erreur createCheckoutSession:', error);
    throw error;
  }
};

/**
 * Rediriger vers Stripe Checkout
 * @param {string} sessionId - ID de la session Stripe
 */
export const redirectToCheckout = async (sessionId) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe n\'a pas pu être initialisé');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      console.error('❌ Erreur redirection Stripe:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erreur redirectToCheckout:', error);
    throw error;
  }
};

/**
 * Vérifier le statut d'un paiement
 * @param {string} sessionId - ID de la session Stripe
 * @returns {Promise<Object>} - Informations sur le paiement
 */
export const verifyPayment = async (sessionId) => {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la vérification du paiement');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('❌ Erreur verifyPayment:', error);
    throw error;
  }
};

/**
 * Créer et rediriger vers Stripe Checkout en une seule action
 * @param {Array} cartItems - Articles du panier
 * @param {Object} customerInfo - Informations client
 */
export const processCheckout = async (cartItems, customerInfo) => {
  try {
    // Créer la session
    const { url } = await createCheckoutSession(cartItems, customerInfo);
    
    // Rediriger directement vers l'URL Stripe
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('URL de paiement non disponible');
    }

  } catch (error) {
    console.error('❌ Erreur processCheckout:', error);
    throw error;
  }
};

export default {
  createCheckoutSession,
  redirectToCheckout,
  verifyPayment,
  processCheckout
};
