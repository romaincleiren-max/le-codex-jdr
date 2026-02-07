// ============================================================================
// SERVICES SUPABASE - Gestion des campagnes, scénarios et commandes
// ============================================================================

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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
  
  logger.log('updateTheme - themeId:', themeId);
  logger.log('updateTheme - cleanedUpdates:', cleanedUpdates);
  
  // D'abord vérifier si le thème existe
  const { data: existingTheme, error: checkError } = await supabase
    .from('themes')
    .select('*')
    .eq('id', themeId);
  
  logger.log('updateTheme - existingTheme:', existingTheme);
  logger.log('updateTheme - checkError:', checkError);
  
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
  
  logger.log('updateTheme - résultat:', data);
  logger.log('updateTheme - error:', error);
  
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

  // Trier les scénarios par numéro (id) pour chaque campagne
  if (data) {
    data.forEach(campaign => {
      if (campaign.scenarios && campaign.scenarios.length > 0) {
        campaign.scenarios.sort((a, b) => a.id - b.id);
      }
    });
  }

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
      name_en: campaign.nameEn || null,
      theme_id: campaign.themeId,
      description: campaign.description,
      description_en: campaign.descriptionEn || null,
      price: campaign.price || 0,
      is_free: campaign.isFree || false,
      pdf_url: campaign.pdfUrl || null,
      background_image_url: campaign.backgroundImageUrl || null,
      background_video_url: campaign.backgroundVideoUrl || null
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
      name_en: updates.nameEn || null,
      theme_id: updates.themeId,
      description: updates.description,
      description_en: updates.descriptionEn || null,
      price: updates.price || 0,
      is_free: updates.isFree || false,
      pdf_url: updates.pdfUrl || null,
      background_image_url: updates.backgroundImageUrl || null,
      background_video_url: updates.backgroundVideoUrl || null
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
  // Calculer la prochaine position disponible
  let nextPosition = scenario.position;

  if (nextPosition === undefined || nextPosition === null) {
    // Récupérer tous les scénarios de cette campagne
    const { data: existingScenarios, error: fetchError } = await supabase
      .from('scenarios')
      .select('position')
      .eq('campaign_id', campaignId)
      .order('position', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    // La prochaine position est la plus haute + 1, ou 1 si aucun scénario
    nextPosition = (existingScenarios && existingScenarios.length > 0)
      ? (existingScenarios[0].position || 0) + 1
      : 1;
  }

  const { data, error } = await supabase
    .from('scenarios')
    .insert([{
      campaign_id: campaignId,
      title: scenario.title,
      display_name: scenario.displayName,
      display_name_en: scenario.displayNameEn || null,
      author: scenario.author,
      description: scenario.description,
      description_en: scenario.descriptionEn || null,
      image_url: scenario.imageUrl || null,
      background_image_url: scenario.backgroundImageUrl || null,
      duration: scenario.duration || '4-6 heures',
      price: scenario.price || 0,
      is_free: scenario.isFree || false,
      pdf_url: scenario.pdfUrl || null,
      ratings: scenario.ratings || { ambiance: 3, complexite: 3, combat: 3, enquete: 3 },
      tags: scenario.tags || [],
      position: nextPosition
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateScenario = async (id, updates) => {
  // Construire l'objet de mise à jour en excluant position si non fourni
  const updateData = {
    title: updates.title,
    display_name: updates.displayName,
    display_name_en: updates.displayNameEn || null,
    author: updates.author,
    description: updates.description,
    description_en: updates.descriptionEn || null,
    image_url: updates.imageUrl || null,
    background_image_url: updates.backgroundImageUrl || null,
    duration: updates.duration || '4-6 heures',
    price: updates.price || 0,
    is_free: updates.isFree || false,
    pdf_url: updates.pdfUrl || null,
    ratings: updates.ratings,
    tags: updates.tags || []
  };

  // N'ajouter position que si elle est explicitement fournie
  if (updates.position !== undefined && updates.position !== null) {
    updateData.position = updates.position;
  }

  const { data, error } = await supabase
    .from('scenarios')
    .update(updateData)
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
// TAGS
// ============================================================================

// Récupérer tous les tags actifs
export const getTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');
  
  if (error) throw error;
  return data;
};

// Récupérer les tags par catégorie
export const getTagsByCategory = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');
  
  if (error) throw error;
  
  // Grouper par catégorie
  const tagsByCategory = {};
  data.forEach(tag => {
    if (!tagsByCategory[tag.category]) {
      tagsByCategory[tag.category] = [];
    }
    tagsByCategory[tag.category].push(tag);
  });
  
  return tagsByCategory;
};

// Créer un nouveau tag
export const createTag = async (tag) => {
  const { data, error } = await supabase
    .from('tags')
    .insert([{
      name: tag.name,
      category: tag.category,
      color: tag.color || '#d97706',
      description: tag.description || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Modifier un tag
export const updateTag = async (id, updates) => {
  const { data, error } = await supabase
    .from('tags')
    .update({
      name: updates.name,
      category: updates.category,
      color: updates.color,
      description: updates.description || null,
      is_active: updates.isActive !== undefined ? updates.isActive : true
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Supprimer (désactiver) un tag
export const deleteTag = async (id) => {
  // On désactive le tag au lieu de le supprimer
  const { error } = await supabase
    .from('tags')
    .update({ is_active: false })
    .eq('id', id);
  
  if (error) throw error;
};

// Récupérer les tags d'un scénario
export const getScenarioTags = async (scenarioId) => {
  const { data, error } = await supabase
    .from('scenario_tags')
    .select(`
      tag_id,
      tags (*)
    `)
    .eq('scenario_id', scenarioId);
  
  if (error) throw error;
  return data.map(st => st.tags);
};

// Assigner des tags à un scénario
export const setScenarioTags = async (scenarioId, tagIds) => {
  // 1. Supprimer tous les tags existants du scénario
  await supabase
    .from('scenario_tags')
    .delete()
    .eq('scenario_id', scenarioId);
  
  // 2. Ajouter les nouveaux tags
  if (tagIds && tagIds.length > 0) {
    const scenarioTags = tagIds.map(tagId => ({
      scenario_id: scenarioId,
      tag_id: tagId
    }));
    
    const { error } = await supabase
      .from('scenario_tags')
      .insert(scenarioTags);
    
    if (error) throw error;
  }
};

// Rechercher des scénarios par tags
export const searchScenariosByTags = async (tagIds) => {
  if (!tagIds || tagIds.length === 0) return [];
  
  const { data, error } = await supabase
    .from('scenario_tags')
    .select(`
      scenario_id,
      scenarios (*)
    `)
    .in('tag_id', tagIds);
  
  if (error) throw error;
  
  // Retourner les scénarios uniques
  const uniqueScenarios = new Map();
  data.forEach(st => {
    if (st.scenarios && !uniqueScenarios.has(st.scenario_id)) {
      uniqueScenarios.set(st.scenario_id, st.scenarios);
    }
  });
  
  return Array.from(uniqueScenarios.values());
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
// UPLOAD DE VIDÉOS
// ============================================================================

// Valider un fichier vidéo
export const validateVideoFile = (file) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const maxSize = 100 * 1024 * 1024; // 100 MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format vidéo non supporté. Utilisez MP4, WebM ou OGG.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `La vidéo est trop volumineuse (max ${maxSize / (1024 * 1024)} MB)` };
  }

  return { valid: true };
};

// Upload d'une vidéo dans le Storage Supabase
export const uploadVideo = async (file, folder = 'backgrounds') => {
  // Validation du fichier
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Générer un nom unique
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 an
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  // Obtenir l'URL publique du fichier
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: publicUrl,
    fileName: fileName
  };
};

// Supprimer une vidéo du Storage
export const deleteVideo = async (videoPath) => {
  const { error } = await supabase.storage
    .from('videos')
    .remove([videoPath]);

  if (error) throw error;
};

// Liste toutes les vidéos d'un dossier
export const listVideos = async (folder = 'backgrounds') => {
  const { data, error } = await supabase.storage
    .from('videos')
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) throw error;

  // Ajouter les URLs publiques
  return data.map(file => ({
    ...file,
    url: supabase.storage.from('videos').getPublicUrl(`${folder}/${file.name}`).data.publicUrl
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
  
  // Créer une URL signée temporaire (valide 5 minutes)
  const { data, error } = await supabase.storage
    .from('submissions')
    .createSignedUrl(fileName, 300); // 300 secondes = 5 minutes

  if (error) throw error;
  
  // Télécharger le fichier depuis l'URL signée
  const response = await fetch(data.signedUrl);
  if (!response.ok) throw new Error('Erreur lors du téléchargement du fichier');
  
  const blob = await response.blob();
  return blob;
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
  
  // Tags
  getTags,
  getTagsByCategory,
  createTag,
  updateTag,
  deleteTag,
  getScenarioTags,
  setScenarioTags,
  searchScenariosByTags,
  
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
  downloadSubmissionPDF,
  
  // Images
  uploadImage,
  deleteImage,
  listImages,
  
  // Vidéos
  uploadVideo,
  deleteVideo,
  listVideos
};
