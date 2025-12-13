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
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, event_category, created_at, event_value')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      // Calculer les statistiques
      const stats = {
        totalVisits: data.filter(e => e.event_type === 'page_view').length,
        scenarioViews: data.filter(e => e.event_type === 'scenario_view').length,
        downloads: data.filter(e => e.event_type === 'download').length,
        cartAdds: data.filter(e => e.event_type === 'cart_add').length,
        purchases: data.filter(e => e.event_type === 'purchase').length,
        revenue: data
          .filter(e => e.event_type === 'purchase')
          .reduce((sum, e) => sum + (parseFloat(e.event_value) || 0), 0),
        
        // Par catégorie
        byCategory: {
          medieval: data.filter(e => e.event_category === 'medieval').length,
          lovecraft: data.filter(e => e.event_category === 'lovecraft').length,
          scifi: data.filter(e => e.event_category === 'scifi').length
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
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('country')
        .not('country', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      // Compter les occurrences par pays
      const countryCounts = {};
      data.forEach(event => {
        if (event.country) {
          countryCounts[event.country] = (countryCounts[event.country] || 0) + 1;
        }
      });
      
      // Convertir en array et trier
      return Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      console.error('❌ Erreur récupération distribution géographique:', error);
      return [];
    }
  }
};

export default analyticsService;
