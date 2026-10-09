let pendingRequest;
export const createCheckoutSession = async (cartItems, customerInfo = {}) => {
  const payload = { cartItems: cartItems.map(entry => ({ type: entry.type, id: entry.item.id })), customerEmail: customerInfo.email?.trim() };
  const identity = JSON.stringify(payload);
  if (pendingRequest?.identity !== identity) pendingRequest = { identity, id: crypto.randomUUID() };
  const response = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, requestId: pendingRequest.id }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Paiement temporairement indisponible.');
  return data;
};
export const verifyPayment = async (sessionId) => {
  const response = await fetch('/api/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Vérification temporairement indisponible.');
  return data;
};
export const processCheckout = async (cartItems, customerInfo) => {
  const { url } = await createCheckoutSession(cartItems, customerInfo);
  const destination = new URL(url);
  if (destination.origin !== 'https://checkout.stripe.com') throw new Error('Adresse de paiement invalide.');
  window.location.assign(destination.href);
};