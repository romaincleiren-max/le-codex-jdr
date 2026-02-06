import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const { t } = useLanguage();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError(t('paymentSuccess.sessionNotFound'));
      setLoading(false);
      return;
    }

    verifyPaymentAndGetDownloadLink();
  }, [sessionId]);

  const verifyPaymentAndGetDownloadLink = async () => {
    try {
      setLoading(true);

      // Vérifier le paiement et récupérer les informations d'achat
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error(t('paymentSuccess.verificationError'));
      }

      const data = await response.json();
      setPurchaseData(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!purchaseData?.downloadToken) return;

    try {
      setDownloadStarted(true);

      // Générer l'URL de téléchargement sécurisée
      const response = await fetch(`/api/download/${purchaseData.downloadToken}`);

      if (!response.ok) {
        throw new Error(t('paymentSuccess.downloadLinkError'));
      }

      const { downloadUrl } = await response.json();

      // Télécharger le fichier
      window.location.href = downloadUrl;

    } catch (err) {
      console.error('Erreur téléchargement:', err);
      alert(t('paymentSuccess.downloadError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-amber-300 text-xl">{t('paymentSuccess.verifying')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
      }}>
        <div className="max-w-2xl w-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-red-500/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-red-400 mb-4">{t('paymentSuccess.errorTitle')}</h1>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-slate-700 hover:bg-slate-600 text-amber-300 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 mx-auto transition-all"
            >
              <ArrowLeft size={20} />
              {t('paymentSuccess.backToHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      <div className="max-w-3xl w-full">
        {/* En-tête de succès */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-green-500 rounded-full p-6 shadow-2xl">
                <CheckCircle size={64} className="text-green-400" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text mb-4">
            {t('paymentSuccess.title')}
          </h1>
          <p className="text-amber-300 text-xl">{t('paymentSuccess.thankYou')}</p>
        </div>

        {/* Carte principale */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-8 shadow-2xl mb-6">
          {/* Informations d'achat */}
          {purchaseData?.items && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-amber-400 mb-4">📦 {t('paymentSuccess.yourOrder')}</h2>
              <div className="space-y-3">
                {purchaseData.items.map((item, index) => (
                  <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-amber-500/30">
                    <p className="text-amber-100 font-semibold text-lg">{item.name}</p>
                    <p className="text-amber-300/70 text-sm">{item.type === 'saga' ? t('paymentSuccess.fullCampaign') : t('paymentSuccess.scenario')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message anti-DRM */}
          <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-2 border-amber-500 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-amber-300 mb-4 text-center">
              📜 {t('paymentSuccess.importantMessage')}
            </h3>
            <div className="text-amber-100 leading-relaxed space-y-3">
              <p className="text-center font-semibold">
                {t('paymentSuccess.noDrm')}
              </p>
              <p className="text-center">
                {t('paymentSuccess.simplePrinciple')} <span className="text-amber-300 font-bold">{t('paymentSuccess.trust')}</span>.
              </p>
              <p className="text-center">
                {t('paymentSuccess.ifShared')}
              </p>
              <p className="text-center">
                {t('paymentSuccess.ifRespected')}
              </p>
              <p className="text-center font-bold text-amber-300 text-lg mt-4">
                {t('paymentSuccess.thankYouSupport')}
              </p>
            </div>
          </div>

          {/* Bouton de téléchargement */}
          <div className="text-center">
            <button
              onClick={handleDownload}
              disabled={!purchaseData?.downloadToken || downloadStarted}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              <Download size={24} />
              {downloadStarted ? t('paymentSuccess.downloading') : t('paymentSuccess.downloadNow')}
            </button>

            {purchaseData?.downloadToken && (
              <p className="text-amber-300/70 text-sm mt-4">
                💡 {t('paymentSuccess.downloadLimit')}
              </p>
            )}
          </div>

          {/* Informations email */}
          <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300 text-center">
              📧 {t('paymentSuccess.emailConfirmation')} <span className="font-semibold">{purchaseData?.email}</span>
            </p>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-slate-700 hover:bg-slate-600 text-amber-300 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 mx-auto transition-all"
          >
            <ArrowLeft size={20} />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};
