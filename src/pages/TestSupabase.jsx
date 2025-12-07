import React from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';

/**
 * Page de test pour vérifier la connexion Supabase
 * Accessible via /test-supabase
 */
export default function TestSupabase() {
  const { themes, campaigns, siteSettings, loading, error, refresh } = useSupabaseData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Connexion à Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900 border border-red-700 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4 flex items-center">
              ❌ Erreur de connexion Supabase
            </h1>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded"
            >
              Réessayer
            </button>
            
            <div className="mt-6 p-4 bg-gray-800 rounded">
              <p className="text-sm text-gray-300">
                💡 <strong>Solutions possibles :</strong>
              </p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1 list-disc list-inside">
                <li>Vérifie que les clés dans <code>.env</code> sont correctes</li>
                <li>Vérifie que le projet Supabase est actif</li>
                <li>Vérifie ta connexion Internet</li>
                <li>Regarde la console (F12) pour plus de détails</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              ✅ Connexion Supabase OK !
            </h1>
            <p className="text-gray-400">
              Toutes les données se chargent correctement depuis Supabase
            </p>
          </div>
          <button
            onClick={refresh}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded flex items-center gap-2"
          >
            🔄 Rafraîchir
          </button>
        </div>

        {/* Paramètres du site */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🏠 Paramètres du site</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400">Nom du site :</p>
              <p className="text-xl font-semibold">{siteSettings.siteName}</p>
            </div>
            <div>
              <p className="text-gray-400">Slogan :</p>
              <p className="text-xl font-semibold">{siteSettings.tagline}</p>
            </div>
          </div>
        </div>

        {/* Thèmes */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🎨 Thèmes chargés</h2>
          <p className="text-gray-400 mb-4">
            {themes.length} thème(s) trouvé(s)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <div key={theme.id} className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">{theme.name}</h3>
                <p className="text-sm text-gray-400">ID : {theme.id}</p>
                {theme.background_image && (
                  <img
                    src={theme.background_image}
                    alt={theme.name}
                    className="w-full h-32 object-cover rounded mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Campagnes */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📚 Campagnes chargées</h2>
          <p className="text-gray-400 mb-4">
            {campaigns.length} campagne(s) trouvée(s)
          </p>
          
          {campaigns.length === 0 ? (
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-200">
                ⚠️ Aucune campagne trouvée dans Supabase.
              </p>
              <p className="text-yellow-300 text-sm mt-2">
                C'est normal si tu n'as pas encore migré tes données localStorage.
                Va dans l'admin pour créer ta première campagne !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{campaign.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">
                        Thème : {campaign.themeId} | {campaign.scenarios?.length || 0} scénario(s)
                      </p>
                      <p className="text-gray-300">{campaign.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">
                        {campaign.isFree ? 'GRATUIT' : `${campaign.price}€`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900 border border-blue-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">🎯 Prochaine étape</h2>
          <p className="mb-4">
            La connexion Supabase fonctionne parfaitement ! Maintenant tu peux :
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-200">
            <li>Migrer tes données localStorage vers Supabase (si tu en as)</li>
            <li>Basculer l'application pour utiliser Supabase au lieu de localStorage</li>
            <li>Configurer Stripe pour les paiements réels</li>
          </ol>
          <p className="mt-4 text-sm text-blue-300">
            💡 Consulte <code>MIGRATION_SUPABASE.md</code> pour les instructions détaillées
          </p>
        </div>

        {/* Boutons de navigation */}
        <div className="mt-6 flex gap-4">
          <a
            href="/"
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded text-center"
          >
            ← Retour à l'accueil
          </a>
          <a
            href="/admin"
            className="bg-purple-700 hover:bg-purple-600 px-6 py-3 rounded text-center"
          >
            Aller à l'admin →
          </a>
        </div>
      </div>
    </div>
  );
}
