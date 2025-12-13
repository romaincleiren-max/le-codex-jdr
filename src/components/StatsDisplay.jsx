// ============================================================================
// COMPOSANT STATISTIQUES - Affichage des vraies données
// ============================================================================

import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';

const StatsDisplay = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [stats, setStats] = useState({
    general: null,
    realtime: null,
    byTheme: [],
    topScenarios: [],
    peakHours: []
  });

  // Charger toutes les statistiques au montage
  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const [general, realtime, byTheme, topScenarios, peakHours] = await Promise.all([
        analyticsService.getGeneralStats(30),
        analyticsService.getRealtimeStats(),
        analyticsService.getStatsByTheme(),
        analyticsService.getTopScenarios(),
        analyticsService.getPeakHours()
      ]);

      setStats({
        general,
        realtime,
        byTheme,
        topScenarios,
        peakHours
      });
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 animate-pulse">📊</div>
        <p className="text-xl text-amber-900 font-bold">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-8">
        {['general', 'medieval', 'lovecraft', 'scifi'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
              activeTab === tab ? 'bg-amber-800 text-white shadow-xl' : 'bg-amber-200 text-amber-900'
            }`}
          >
            {tab === 'general' && '📊 Général'}
            {tab === 'medieval' && '⚔️ Médiéval'}
            {tab === 'lovecraft' && '👁️ Lovecraft'}
            {tab === 'scifi' && '🚀 Sci-Fi'}
          </button>
        ))}
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'general' && (
        <div>
          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-100 border-4 border-blue-700 rounded-lg p-6 text-center shadow-xl">
              <div className="text-5xl mb-3">👁️</div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Visites</h3>
              <p className="text-4xl font-bold text-blue-800">
                {stats.general?.totalVisits || 0}
              </p>
              <p className="text-sm text-blue-600 mt-2">30 derniers jours</p>
            </div>

            <div className="bg-purple-100 border-4 border-purple-700 rounded-lg p-6 text-center shadow-xl">
              <div className="text-5xl mb-3">📖</div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">Scénarios Vus</h3>
              <p className="text-4xl font-bold text-purple-800">
                {stats.general?.scenarioViews || 0}
              </p>
              <p className="text-sm text-purple-600 mt-2">30 derniers jours</p>
            </div>

            <div className="bg-green-100 border-4 border-green-700 rounded-lg p-6 text-center shadow-xl">
              <div className="text-5xl mb-3">⬇️</div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Téléchargements</h3>
              <p className="text-4xl font-bold text-green-800">
                {stats.general?.downloads || 0}
              </p>
              <p className="text-sm text-green-600 mt-2">30 derniers jours</p>
            </div>
          </div>

          {/* Statistiques en temps réel (24h) */}
          {stats.realtime && (
            <div className="bg-cyan-100 border-4 border-cyan-700 rounded-lg p-6 mb-8 shadow-xl">
              <h2 className="text-2xl font-bold text-cyan-900 mb-4">⚡ Temps réel (24h)</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-cyan-700">Visites</p>
                  <p className="text-3xl font-bold text-cyan-900">{stats.realtime.total_visits || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-cyan-700">Sessions</p>
                  <p className="text-3xl font-bold text-cyan-900">{stats.realtime.unique_sessions || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-cyan-700">Téléchargements</p>
                  <p className="text-3xl font-bold text-cyan-900">{stats.realtime.total_downloads || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-cyan-700">Paniers</p>
                  <p className="text-3xl font-bold text-cyan-900">{stats.realtime.cart_adds || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Répartition par thème */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-900">🌍 Répartition par Thème</h2>
              <div className="space-y-3">
                {stats.byTheme && stats.byTheme.length > 0 ? (
                  stats.byTheme.map(theme => (
                    <div key={theme.theme} className="flex justify-between items-center">
                      <span className="font-semibold">
                        {theme.theme === 'medieval' && '⚔️ Médiéval'}
                        {theme.theme === 'lovecraft' && '👁️ Lovecraft'}
                        {theme.theme === 'scifi' && '🚀 Sci-Fi'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-700">{theme.unique_visitors} visiteurs</span>
                        <span className="font-bold text-amber-900">{theme.total_views} vues</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-amber-700 text-center py-4">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-amber-900">⏰ Heures de Pointe</h2>
              <div className="space-y-3">
                {stats.peakHours && stats.peakHours.length > 0 ? (
                  stats.peakHours.map((hour, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{Math.floor(hour.hour)}h - {Math.floor(hour.hour) + 1}h</span>
                      <span className="font-bold">{hour.event_count} événements</span>
                    </div>
                  ))
                ) : (
                  <p className="text-amber-700 text-center py-4">Aucune donnée disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Top scénarios */}
          <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-amber-900">🏆 Top 10 Scénarios</h2>
            {stats.topScenarios && stats.topScenarios.length > 0 ? (
              <div className="space-y-3">
                {stats.topScenarios.map((scenario, index) => (
                  <div key={scenario.id} className="bg-amber-50 p-3 rounded-lg border-2 border-amber-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-amber-800 text-white px-3 py-1 rounded-full font-bold">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-amber-900">{scenario.display_name}</p>
                          <p className="text-sm text-amber-700">{scenario.campaign_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>👁️ {scenario.unique_views}</span>
                        <span>📥 {scenario.downloads}</span>
                        <span>🛒 {scenario.cart_adds}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-amber-700 text-center py-8">
                Aucun scénario consulté récemment.<br/>
                Les statistiques s'accumuleront au fur et à mesure des visites.
              </p>
            )}
          </div>

          {/* Message si pas de données */}
          {(!stats.general || stats.general.totalVisits === 0) && (
            <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-6 mt-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-yellow-900 mb-2">Statistiques en cours de collecte</h3>
              <p className="text-yellow-800">
                Le système de tracking est actif. Les statistiques apparaîtront au fur et à mesure des visites sur le site.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistiques par thème spécifique */}
      {activeTab !== 'general' && (
        <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-8 text-center shadow-xl">
          <div className="text-6xl mb-4">
            {activeTab === 'medieval' && '⚔️'}
            {activeTab === 'lovecraft' && '👁️'}
            {activeTab === 'scifi' && '🚀'}
          </div>
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            Statistiques {activeTab === 'medieval' ? 'Médiéval' : activeTab === 'lovecraft' ? 'Lovecraft' : 'Sci-Fi'}
          </h2>
          {stats.byTheme && stats.byTheme.find(t => t.theme === activeTab) ? (
            <div className="max-w-md mx-auto">
              {(() => {
                const themeData = stats.byTheme.find(t => t.theme === activeTab);
                return (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-amber-50 p-6 rounded-lg">
                      <p className="text-sm text-amber-700 mb-2">Vues Totales</p>
                      <p className="text-4xl font-bold text-amber-900">{themeData.total_views}</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-lg">
                      <p className="text-sm text-amber-700 mb-2">Visiteurs Uniques</p>
                      <p className="text-4xl font-bold text-amber-900">{themeData.unique_visitors}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-amber-700">Aucune donnée disponible pour ce thème</p>
          )}
        </div>
      )}

      {/* Bouton de rafraîchissement */}
      <div className="text-center mt-8">
        <button
          onClick={loadAllStats}
          className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-bold inline-flex items-center gap-2"
        >
          🔄 Actualiser les statistiques
        </button>
      </div>
    </div>
  );
};

export default StatsDisplay;
