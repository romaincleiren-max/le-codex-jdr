// ============================================================================
// COMPOSANT STATISTIQUES - Design moderne et élégant
// ============================================================================

import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import { TrendingUp, Eye, Download, ShoppingCart, Users, Clock, Award, BarChart3 } from 'lucide-react';

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
      <div className="text-center py-20">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative text-8xl mb-6 animate-bounce">📊</div>
        </div>
        <p className="text-2xl text-amber-300 font-bold">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Onglets modernes */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        {[
          { id: 'general', icon: '📊', label: 'Général', gradient: 'from-blue-500 to-purple-600' },
          { id: 'medieval', icon: '⚔️', label: 'Médiéval', gradient: 'from-amber-500 to-orange-600' },
          { id: 'lovecraft', icon: '👁️', label: 'Lovecraft', gradient: 'from-emerald-500 to-teal-600' },
          { id: 'scifi', icon: '🚀', label: 'Sci-Fi', gradient: 'from-cyan-500 to-blue-600' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === tab.id 
                ? 'text-white shadow-2xl' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 text-amber-300 border-2 border-amber-700/30 hover:border-amber-600/50'
            }`}
          >
            {activeTab === tab.id && (
              <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl`}></div>
            )}
            <span className="relative flex items-center gap-2">
              <span className="text-2xl">{tab.icon}</span>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          {/* Cartes de statistiques principales - Design glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm border-2 border-blue-500/30 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-blue-500/20 rounded-full">
                    <Eye size={48} className="text-blue-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-blue-300 mb-3">Visites Totales</h3>
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  {stats.general?.totalVisits || 0}
                </p>
                <p className="text-sm text-blue-400/70 mt-3">📅 30 derniers jours</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-purple-500/20 rounded-full">
                    <BarChart3 size={48} className="text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-purple-300 mb-3">Scénarios Vus</h3>
                <p className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  {stats.general?.scenarioViews || 0}
                </p>
                <p className="text-sm text-purple-400/70 mt-3">📅 30 derniers jours</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border-2 border-green-500/30 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-500/20 rounded-full">
                    <Download size={48} className="text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-300 mb-3">Téléchargements</h3>
                <p className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {stats.general?.downloads || 0}
                </p>
                <p className="text-sm text-green-400/70 mt-3">📅 30 derniers jours</p>
              </div>
            </div>
          </div>

          {/* Statistiques en temps réel */}
          {stats.realtime && (
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/20 rounded-full">
                  <TrendingUp size={32} className="text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold text-cyan-300">⚡ Temps réel (24h)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Visites', value: stats.realtime.total_visits || 0, icon: Eye, color: 'cyan' },
                  { label: 'Sessions', value: stats.realtime.unique_sessions || 0, icon: Users, color: 'blue' },
                  { label: 'Téléchargements', value: stats.realtime.total_downloads || 0, icon: Download, color: 'green' },
                  { label: 'Paniers', value: stats.realtime.cart_adds || 0, icon: ShoppingCart, color: 'purple' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center p-4 bg-slate-800/50 rounded-xl backdrop-blur-sm">
                    <stat.icon size={24} className={`mx-auto mb-2 text-${stat.color}-400`} />
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-4xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Répartition par thème et heures de pointe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-sm border-2 border-amber-500/30 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/20 rounded-full">
                  <BarChart3 size={28} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-amber-300">🌍 Par Thème</h2>
              </div>
              <div className="space-y-4">
                {stats.byTheme && stats.byTheme.length > 0 ? (
                  stats.byTheme.map(theme => (
                    <div key={theme.theme} className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 hover:border-amber-500/50 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-amber-300">
                          {theme.theme === 'medieval' && '⚔️ Médiéval'}
                          {theme.theme === 'lovecraft' && '👁️ Lovecraft'}
                          {theme.theme === 'scifi' && '🚀 Sci-Fi'}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-400">Visiteurs</p>
                            <p className="text-xl font-bold text-white">{theme.unique_visitors}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-400">Vues</p>
                            <p className="text-xl font-bold text-amber-400">{theme.total_views}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-8">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-sm border-2 border-indigo-500/30 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-full">
                  <Clock size={28} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-indigo-300">⏰ Heures de Pointe</h2>
              </div>
              <div className="space-y-3">
                {stats.peakHours && stats.peakHours.length > 0 ? (
                  stats.peakHours.map((hour, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-800/50 backdrop-blur-sm p-3 rounded-lg border border-slate-700/50">
                      <span className="text-indigo-300 font-semibold">
                        {Math.floor(hour.hour)}h - {Math.floor(hour.hour) + 1}h
                      </span>
                      <span className="font-bold text-white">{hour.event_count} événements</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-8">Aucune donnée disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Top scénarios */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-600/10 backdrop-blur-sm border-2 border-yellow-500/30 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <Award size={32} className="text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold text-yellow-300">🏆 Top 10 Scénarios</h2>
            </div>
            {stats.topScenarios && stats.topScenarios.length > 0 ? (
              <div className="space-y-3">
                {stats.topScenarios.map((scenario, index) => (
                  <div key={scenario.id} className="group bg-slate-800/50 backdrop-blur-sm p-5 rounded-xl border border-slate-700/50 hover:border-yellow-500/50 transition-all hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-white">{scenario.display_name}</p>
                          <p className="text-sm text-slate-400">{scenario.campaign_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <Eye size={16} className="mx-auto text-blue-400 mb-1" />
                          <span className="text-white font-semibold">{scenario.unique_views}</span>
                        </div>
                        <div className="text-center">
                          <Download size={16} className="mx-auto text-green-400 mb-1" />
                          <span className="text-white font-semibold">{scenario.downloads}</span>
                        </div>
                        <div className="text-center">
                          <ShoppingCart size={16} className="mx-auto text-purple-400 mb-1" />
                          <span className="text-white font-semibold">{scenario.cart_adds}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                <div className="text-6xl mb-4 opacity-50">📊</div>
                <p className="text-slate-400 text-lg">
                  Aucun scénario consulté récemment.<br/>
                  <span className="text-sm">Les statistiques s'accumuleront au fur et à mesure des visites.</span>
                </p>
              </div>
            )}
          </div>

          {/* Message si pas de données */}
          {(!stats.general || stats.general.totalVisits === 0) && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-8 text-center backdrop-blur-sm">
              <div className="text-7xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-yellow-300 mb-3">Statistiques en cours de collecte</h3>
              <p className="text-yellow-400/80 text-lg">
                Le système de tracking est actif. Les statistiques apparaîtront au fur et à mesure des visites sur le site.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistiques par thème spécifique */}
      {activeTab !== 'general' && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/30 rounded-2xl p-12 text-center shadow-xl backdrop-blur-sm">
          <div className="text-8xl mb-6">
            {activeTab === 'medieval' && '⚔️'}
            {activeTab === 'lovecraft' && '👁️'}
            {activeTab === 'scifi' && '🚀'}
          </div>
          <h2 className="text-4xl font-bold text-amber-300 mb-8">
            Statistiques {activeTab === 'medieval' ? 'Médiéval' : activeTab === 'lovecraft' ? 'Lovecraft' : 'Sci-Fi'}
          </h2>
          {stats.byTheme && stats.byTheme.find(t => t.theme === activeTab) ? (
            <div className="max-w-2xl mx-auto">
              {(() => {
                const themeData = stats.byTheme.find(t => t.theme === activeTab);
                return (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-amber-500/30">
                      <BarChart3 size={48} className="mx-auto mb-4 text-amber-400" />
                      <p className="text-sm text-amber-400 mb-2">Vues Totales</p>
                      <p className="text-6xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        {themeData.total_views}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm p-8 rounded-2xl border-2 border-blue-500/30">
                      <Users size={48} className="mx-auto mb-4 text-blue-400" />
                      <p className="text-sm text-blue-400 mb-2">Visiteurs Uniques</p>
                      <p className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        {themeData.unique_visitors}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-slate-400 text-xl">Aucune donnée disponible pour ce thème</p>
          )}
        </div>
      )}

      {/* Bouton de rafraîchissement */}
      <div className="text-center mt-10">
        <button
          onClick={loadAllStats}
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
          <span className="relative">🔄 Actualiser les statistiques</span>
        </button>
      </div>
    </div>
  );
};

export default StatsDisplay;
