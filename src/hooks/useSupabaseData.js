// ============================================================================
// HOOK REACT - Chargement des données depuis Supabase
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  getThemes, 
  getCampaigns, 
  getSiteSettings 
} from '../services/supabaseService';

/**
 * Hook pour charger toutes les données depuis Supabase
 * Remplace le chargement depuis localStorage
 */
export const useSupabaseData = () => {
  const [themes, setThemes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
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
      const [themesData, campaignsData, settingsData] = await Promise.all([
        getThemes(),
        getCampaigns(),
        getSiteSettings()
      ]);

      // Transformer les données Supabase pour correspondre au format actuel
      const transformedCampaigns = campaignsData.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        themeId: campaign.theme_id,
        description: campaign.description,
        price: parseFloat(campaign.price),
        isFree: campaign.is_free,
        pdfUrl: campaign.pdf_url,
        backgroundImageUrl: campaign.background_image_url,
        scenarios: (campaign.scenarios || []).map(scenario => ({
          id: scenario.id,
          title: scenario.title,
          displayName: scenario.display_name,
          author: scenario.author,
          description: scenario.description,
          imageUrl: scenario.image_url,
          backgroundImageUrl: scenario.background_image_url,
          duration: scenario.duration,
          price: parseFloat(scenario.price),
          isFree: scenario.is_free,
          pdfUrl: scenario.pdf_url,
          ratings: scenario.ratings,
          tags: scenario.tags || []
        }))
      }));

      const transformedSettings = {
        siteName: settingsData.site_name,
        logoUrl: settingsData.logo_url || '',
        tagline: settingsData.tagline || ''
      };

      setThemes(themesData);
      setCampaigns(transformedCampaigns);
      setSiteSettings(transformedSettings);
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

  // Fonction pour rafraîchir les données
  const refresh = () => {
    loadAllData();
  };

  return {
    themes,
    campaigns,
    siteSettings,
    loading,
    error,
    refresh,
    // Fonctions de mise à jour (à implémenter)
    setThemes,
    setCampaigns,
    setSiteSettings
  };
};
