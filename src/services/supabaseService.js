// ============================================================================
// SERVICES SUPABASE - Gestion des campagnes, scénarios et commandes
// ============================================================================

import { supabase } from '../lib/supabase';

// ============================================================================
// THÈMES
// ============================================================================

export const getThemes = async () => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('id');
  
  if (error) throw error;
  return data;
};

export const updateTheme = async (themeId, updates) => {
  const { data, error } = await supabase
    .from('themes')
    .update(updates)
    .eq('id', themeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ============================================================================
// CAMPAGNES
// ============================================================================

export const getCampaigns = async () => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      scenarios (*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getCampaignById = async (id) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      scenarios (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createCampaign = async (campaign) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{
      name: campaign.name,
      theme_id: campaign.themeId,
      description: campaign.description,
      price: campaign.price || 0,
      is_free: campaign.isFree || false,
      pdf_url: campaign.pdfUrl || null,
      background_image_url: campaign.backgroundImageUrl || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCampaign = async (id, updates) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      name: updates.name,
      theme_id: updates.themeId,
      description: updates.description,
      price: updates.price || 0,
      is_free: updates.isFree || false,
      pdf_url: updates.pdfUrl || null,
      background_image_url: updates.backgroundImageUrl || null
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCampaign = async (id) => {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================================================
// SCÉNARIOS
// ============================================================================

export const getScenarios = async (campaignId) => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('position');
  
  if (error) throw error;
  return data;
};

export const createScenario = async (campaignId, scenario) => {
  const { data, error } = await supabase
    .from('scenarios')
    .insert([{
      campaign_id: campaignId,
      title: scenario.title,
      display_name: scenario.displayName,
      author: scenario.author,
      description: scenario.description,
      image_url: scenario.imageUrl || null,
      background_image_url: scenario.backgroundImageUrl || null,
      duration: scenario.duration || '4-6 heures',
      price: scenario.price || 0,
      is_free: scenario.isFree || false,
      pdf_url: scenario.pdfUrl || null,
      ratings: scenario.ratings || { ambiance: 3, complexite: 3, combat: 3, enquete: 3 },
      tags: scenario.tags || [],
      position: scenario.position || 0
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateScenario = async (id, updates) => {
  const { data, error } = await supabase
    .from('scenarios')
    .update({
      title: updates.title,
      display_name: updates.displayName,
      author: updates.author,
      description: updates.description,
      image_url: updates.imageUrl || null,
      background_image_url: updates.backgroundImageUrl || null,
      duration: updates.duration || '4-6 heures',
      price: updates.price || 0,
      is_free: updates.isFree || false,
      pdf_url: updates.pdfUrl || null,
      ratings: updates.ratings,
      tags: updates.tags || [],
      position: updates.position || 0
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteScenario = async (id) => {
  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================================================
// PARAMÈTRES DU SITE
// ============================================================================

export const getSiteSettings = async () => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSiteSettings = async (settings) => {
  const { data, error } = await supabase
    .from('site_settings')
    .update({
      site_name: settings.siteName,
      logo_url: settings.logoUrl || null,
      tagline: settings.tagline || null
    })
    .eq('id', 1)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ============================================================================
// COMMANDES (pour Stripe plus tard)
// ============================================================================

export const createOrder = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      customer_email: orderData.email,
      customer_first_name: orderData.firstName,
      customer_last_name: orderData.lastName,
      total_amount: orderData.totalAmount,
      status: 'pending'
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createOrderItems = async (orderId, items) => {
  const orderItems = items.map(item => ({
    order_id: orderId,
    item_type: item.type === 'saga' ? 'campaign' : 'scenario',
    item_id: item.item.id,
    item_name: item.type === 'saga' ? item.item.name : item.item.displayName,
    price: item.item.price
  }));

  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();
  
  if (error) throw error;
  return data;
};

export const updateOrderStatus = async (orderId, status, paymentId = null) => {
  const updates = {
    status,
    ...(paymentId && { stripe_payment_id: paymentId })
  };

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getOrdersByEmail = async (email) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// ============================================================================
// EXPORT PAR DÉFAUT - Objet regroupant tous les services
// ============================================================================

export const supabaseService = {
  // Thèmes
  getThemes,
  updateTheme,
  
  // Campagnes
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  
  // Scénarios
  getScenarios,
  createScenario,
  addScenario: createScenario, // Alias
  updateScenario,
  deleteScenario,
  
  // Paramètres
  getSiteSettings,
  updateSiteSettings,
  
  // Commandes
  createOrder,
  createOrderItems,
  updateOrderStatus,
  getOrdersByEmail
};
