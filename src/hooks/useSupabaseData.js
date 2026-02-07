// ============================================================================
// HOOK REACT - Chargement des données depuis Supabase
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  getThemes, 
  getCampaigns, 
  getSiteSettings,
  getTagsByCategory
} from '../services/supabaseService';

/**
 * Hook pour charger toutes les données depuis Supabase
 * Remplace le chargement depuis localStorage
 */
export const useSupabaseData = () => {
  const [themes, setThemes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [tags, setTags] = useState({});
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Le Codex',
    logoUrl: '',
    tagline: 'Bibliothèque de scénarios JDR'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données au montage du composant
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger en parallèle pour plus de rapidité
      const [themesData, campaignsData, settingsData, tagsData] = await Promise.all([
        getThemes(),
        getCampaigns(),
        getSiteSettings(),
        getTagsByCategory()
      ]);

      // Transformer les données Supabase pour correspondre au format actuel
      const transformedCampaigns = campaignsData.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        nameEn: campaign.name_en || '',
        themeId: campaign.theme_id,
        description: campaign.description,
        descriptionEn: campaign.description_en || '',
        price: parseFloat(campaign.price),
        isFree: campaign.is_free,
        pdfUrl: campaign.pdf_url,
        backgroundImageUrl: campaign.background_image_url,
        scenarios: (campaign.scenarios || [])
          .map(scenario => ({
            id: scenario.id,
            title: scenario.title,
            displayName: scenario.display_name,
            displayNameEn: scenario.display_name_en || '',
            author: scenario.author,
            description: scenario.description,
            descriptionEn: scenario.description_en || '',
            imageUrl: scenario.image_url,
            backgroundImageUrl: scenario.background_image_url,
            duration: scenario.duration,
            price: parseFloat(scenario.price),
            isFree: scenario.is_free,
            pdfUrl: scenario.pdf_url,
            ratings: scenario.ratings,
            tags: scenario.tags || [],
            position: scenario.position || 0
          }))
          .sort((a, b) => a.position - b.position)
      }));

      const transformedSettings = {
        siteName: settingsData.site_name,
        logoUrl: settingsData.logo_url || '',
        tagline: settingsData.tagline || ''
      };

      setThemes(themesData);
      setCampaigns(transformedCampaigns);
      setSiteSettings(transformedSettings);
      setTags(tagsData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message);
      setLoading(false);
      
      // Fallback : charger depuis localStorage en cas d'erreur
      loadFromLocalStorage();
    }
  };

  // Fallback : charger depuis localStorage si Supabase échoue
  const loadFromLocalStorage = () => {
    try {
      const savedThemes = localStorage.getItem('le-codex-themes');
      const savedCampaigns = localStorage.getItem('le-codex-sagas');
      const savedSettings = localStorage.getItem('le-codex-site-settings');

      if (savedThemes) setThemes(JSON.parse(savedThemes));
      if (savedCampaigns) setCampaigns(JSON.parse(savedCampaigns));
      if (savedSettings) setSiteSettings(JSON.parse(savedSettings));
      
      console.warn('⚠️ Données chargées depuis localStorage (fallback)');
    } catch (err) {
      console.error('Erreur fallback localStorage:', err);
    }
  };

  // Fonction pour rafraîchir les données (retourne une promesse)
  const refresh = async () => {
    await loadAllData();
  };

  return {
    themes,
    campaigns,
    siteSettings,
    tags,
    loading,
    error,
    refresh,
    // Fonctions de mise à jour (à implémenter)
    setThemes,
    setCampaigns,
    setSiteSettings,
    setTags
  };
};
