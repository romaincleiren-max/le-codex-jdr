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
  // Convertir les clés camelCase en snake_case et nettoyer les valeurs
  const cleanedUpdates = {};
  
  if (updates.backgroundImage !== undefined) {
    cleanedUpdates.background_image = updates.backgroundImage || null;
  }
  if (updates.background_image !== undefined) {
    cleanedUpdates.background_image = updates.background_image || null;
  }
  if (updates.name !== undefined) {
    cleanedUpdates.name = updates.name;
  }
  
  console.log('updateTheme - themeId:', themeId);
  console.log('updateTheme - cleanedUpdates:', cleanedUpdates);
  
  // D'abord vérifier si le thème existe
  const { data: existingTheme, error: checkError } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId);
  
  console.log('updateTheme - existingTheme:', existingTheme);
  console.log('updateTheme - checkError:', checkError);
  
  if (checkError) throw checkError;
  
  if (!existingTheme || existingTheme.length === 0) {
    throw new Error(`Le thème "${themeId}" n'existe pas dans la base de données`);
  }
  
  // Maintenant faire la mise à jour
  const { data, error } = await supabase
    .from('themes')
    .update(cleanedUpdates)
    .eq('id', themeId)
    .select();
  
  console.log('updateTheme - résultat:', data);
  console.log('updateTheme - error:', error);
  
  if (error) throw error;
  
  // Retourner le premier élément si c'est un tableau
  return Array.isArray(data) ? data[0] : data;
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
// UPLOAD D'IMAGES
// ============================================================================

import { sanitizeFileName, validateImageFile } from '../utils/validation';

// Upload d'une image dans le Storage Supabase
export const uploadImage = async (file, folder = 'general') => {
  // Validation complète du fichier
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Sanitizer le nom de fichier (enlève accents, espaces, caractères spéciaux)
  const sanitizedName = sanitizeFileName(file.name);
  
  // Générer un nom unique avec timestamp
  const fileExt = sanitizedName.split('.').pop();
  const baseName = sanitizedName.replace(`.${fileExt}`, '');
  const fileName = `${Date.now()}-${baseName}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 an
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  // Obtenir l'URL publique du fichier
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: publicUrl,
    fileName: fileName
  };
};

// Supprimer une image du Storage
export const deleteImage = async (imagePath) => {
  const { error } = await supabase.storage
    .from('images')
    .remove([imagePath]);

  if (error) throw error;
};

// Liste toutes les images d'un dossier
export const listImages = async (folder = 'general') => {
  const { data, error } = await supabase.storage
    .from('images')
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) throw error;

  // Ajouter les URLs publiques
  return data.map(file => ({
    ...file,
    url: supabase.storage.from('images').getPublicUrl(`${folder}/${file.name}`).data.publicUrl
  }));
};

// ============================================================================
// SOUMISSIONS DE SCÉNARIOS
// ============================================================================

// Upload d'un PDF dans le Storage Supabase
export const uploadSubmissionPDF = async (file) => {
  // Générer un nom de fichier unique
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('submissions')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Obtenir l'URL publique du fichier
  const { data: { publicUrl } } = supabase.storage
    .from('submissions')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: publicUrl
  };
};

// Créer une nouvelle soumission
export const createSubmission = async (submissionData, pdfFile) => {
  // 1. Upload du PDF
  const { path, url } = await uploadSubmissionPDF(pdfFile);

  // 2. Créer l'entrée dans la base de données
  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      scenario_name: submissionData.scenarioName,
      author: submissionData.author,
      email: submissionData.email,
      summary: submissionData.summary,
      pdf_filename: pdfFile.name,
      pdf_url: url,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    // Si erreur, supprimer le fichier uploadé
    await supabase.storage.from('submissions').remove([path]);
    throw error;
  }

  return data;
};

// Récupérer toutes les soumissions
export const getSubmissions = async () => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Mettre à jour le statut d'une soumission
export const updateSubmissionStatus = async (id, status, adminNotes = null) => {
  const updates = {
    status,
    ...(adminNotes && { admin_notes: adminNotes })
  };

  const { data, error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Supprimer une soumission
export const deleteSubmission = async (id) => {
  // 1. Récupérer la soumission pour obtenir le chemin du fichier
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('pdf_url')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // 2. Extraire le nom du fichier de l'URL
  const fileName = submission.pdf_url.split('/').pop();

  // 3. Supprimer le fichier du Storage
  await supabase.storage
    .from('submissions')
    .remove([fileName]);

  // 4. Supprimer l'entrée de la base de données
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Télécharger un PDF de soumission
export const downloadSubmissionPDF = async (pdfUrl) => {
  const fileName = pdfUrl.split('/').pop();
  
  const { data, error } = await supabase.storage
    .from('submissions')
    .download(fileName);

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
  getOrdersByEmail,
  
  // Soumissions
  createSubmission,
  getSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  uploadSubmissionPDF,
  downloadSubmissionPDF
};
