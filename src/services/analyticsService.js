// ============================================================================
// SERVICE ANALYTICS - Tracking et statistiques réelles
// ============================================================================

import { supabase } from '../lib/supabase';

// Générer ou récupérer un ID de session unique
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  
  return sessionId;
};

// Fonction pour tracker un événement
export const trackEvent = async (eventType, options = {}) => {
  try {
    const sessionId = getSessionId();
    
    const eventData = {
      event_type: eventType,
      event_category: options.category || null,
      event_label: options.label || null,
      event_value: options.value || null,
      scenario_id: options.scenarioId || null,
      campaign_id: options.campaignId || null,
      session_id: sessionId,
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };
    
    // Insérer l'événement dans Supabase (RLS permet l'insertion publique)
    const { error } = await supabase
      .from('analytics_events')
      .insert([eventData]);
    
    if (error) {
      console.error('❌ Erreur tracking événement:', error);
    } else {
      console.log('✅ Événement tracké:', eventType, options);
    }
  } catch (error) {
    console.error('❌ Erreur tracking:', error);
  }
};

// Fonctions de tracking spécifiques
export const analyticsService = {
  
  // Tracker une visite de page
  trackPageView: (page, category = null) => {
    trackEvent('page_view', {
      category: category || page,
      label: `Page: ${page}`
    });
  },
  
  // Tracker la vue d'un scénario
  trackScenarioView: (scenario, campaign) => {
    trackEvent('scenario_view', {
      category: campaign.themeId,
      label: scenario.displayName || scenario.title,
      scenarioId: scenario.id,
      campaignId: campaign.id
    });
  },
  
  // Tracker un téléchargement
  trackDownload: (item, type = 'scenario') => {
    trackEvent('download', {
      category: type,
      label: item.displayName || item.name || item.title,
      scenarioId: type === 'scenario' ? item.id : null,
      campaignId: type === 'campaign' ? item.id : null
    });
  },
  
  // Tracker un ajout au panier
  trackAddToCart: (item, type = 'scenario') => {
    trackEvent('cart_add', {
      category: type,
      label: item.displayName || item.name || item.title,
      value: item.price,
      scenarioId: type === 'scenario' ? item.id : null,
      campaignId: type === 'campaign' ? item.id : null
    });
  },
  
  // Tracker un achat
  trackPurchase: (cart, total) => {
    cart.forEach(cartItem => {
      const item = cartItem.item;
      const type = cartItem.type;
      
      trackEvent('purchase', {
        category: type,
        label: item.displayName || item.name || item.title,
        value: item.price,
        scenarioId: type === 'scenario' ? item.id : null,
        campaignId: type === 'saga' ? item.id : null
      });
    });
    
    // Événement global pour le total
    trackEvent('purchase', {
      category: 'total',
      label: `Order total: ${cart.length} items`,
      value: total
    });
  },
  
  // Récupérer les statistiques en temps réel (admin uniquement)
  async getRealtimeStats() {
    try {
      const { data, error } = await supabase
        .from('analytics_realtime')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération stats temps réel:', error);
      return null;
    }
  },
  
  // Récupérer les stats par thème
  async getStatsByTheme() {
    try {
      const { data, error } = await supabase
        .from('analytics_by_theme')
        .select('*')
        .order('total_views', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération stats par thème:', error);
      return [];
    }
  },
  
  // Récupérer les scénarios les plus populaires
  async getTopScenarios() {
    try {
      const { data, error } = await supabase
        .from('analytics_top_scenarios')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération top scénarios:', error);
      return [];
    }
  },
  
  // Récupérer les heures de pointe
  async getPeakHours() {
    try {
      const { data, error } = await supabase
        .from('analytics_peak_hours')
        .select('*')
        .order('event_count', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération heures de pointe:', error);
      return [];
    }
  },
  
  // Récupérer les statistiques générales des derniers jours
  async getGeneralStats(days = 30) {
    try {
      // Utiliser les vues analytics au lieu de lire directement analytics_events
      // pour éviter les problèmes RLS
      const [realtimeData, byThemeData] = await Promise.all([
        supabase.from('analytics_realtime').select('*').single(),
        supabase.from('analytics_by_theme').select('*')
      ]);

      if (realtimeData.error) throw realtimeData.error;

      // Construire les stats depuis les vues
      const stats = {
        totalVisits: realtimeData.data?.total_visits || 0,
        scenarioViews: realtimeData.data?.scenario_views || 0,
        downloads: realtimeData.data?.total_downloads || 0,
        cartAdds: realtimeData.data?.cart_adds || 0,
        purchases: realtimeData.data?.purchases || 0,
        revenue: realtimeData.data?.revenue || 0,

        // Par catégorie (depuis analytics_by_theme)
        byCategory: {
          medieval: byThemeData.data?.find(t => t.theme === 'medieval')?.total_views || 0,
          lovecraft: byThemeData.data?.find(t => t.theme === 'lovecraft')?.total_views || 0,
          scifi: byThemeData.data?.find(t => t.theme === 'scifi')?.total_views || 0
        }
      };

      return stats;
    } catch (error) {
      console.error('❌ Erreur récupération stats générales:', error);
      return null;
    }
  },
  
  // Récupérer la répartition géographique (si on a des données)
  async getGeographicDistribution() {
    // Note: La colonne 'country' n'existe pas dans analytics_events
    // Cette fonctionnalité nécessiterait d'ajouter le tracking géographique
    // Pour l'instant, retourner un tableau vide
    return [];
  }
};

export default analyticsService;
