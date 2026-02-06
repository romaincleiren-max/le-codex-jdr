// ============================================================================
// LE CODEX - APPLICATION COMPLÈTE
// Toutes les pages Admin, Stats, À propos + Gestion Gratuit/Payant
// ============================================================================

import './index.css';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Download, Star, Clock, ChevronLeft, ChevronRight, ShoppingCart, Trash2, CreditCard, Check, Edit, Plus, X, Lock, Menu } from 'lucide-react';
import TestSupabase from './pages/TestSupabase';
import { LoginPage } from './pages/LoginPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LanguageProvider, useLanguage } from './i18n';
import { useSupabaseData } from './hooks/useSupabaseData';
import { supabaseService } from './services/supabaseService';
import { supabase } from './lib/supabase';
import ScenarioCarousel from './components/carousel/ScenarioCarousel';
import { processCheckout } from './services/stripeService';
import StatsDisplay from './components/StatsDisplay';
import { validateSubmissionForm, validatePDFFile } from './utils/validation';
import { submissionRateLimiter } from './utils/rateLimiter';
import RateLimiter from './utils/rateLimiter';

const adminConfig = {
  titleFont: "font-serif",
  ratingIcons: {
    ambiance: "🌙",
    complexite: "🧩",
    combat: "⚔️",
    enquete: "🔍"
  },
  ratingLabels: {
    ambiance: "Ambiance",
    complexite: "Complexité", 
    combat: "Combat",
    enquete: "Enquête"
  }
};

// Site vide au démarrage - les campagnes doivent être ajoutées via l'admin
const initialSagasData = [];

const initialThemesData = [
  {
    id: "medieval",
    name: "Médiéval Fantasy",
    backgroundImage: "",
    colors: {
      bg: "bg-slate-900", primary: "bg-emerald-900", text: "text-emerald-100",
      textLight: "text-emerald-300", card: "bg-slate-800", hover: "hover:bg-emerald-800",
      starFilled: "text-emerald-400", starEmpty: "text-slate-600", tag: "bg-emerald-900 text-emerald-300"
    }
  },
  {
    id: "lovecraft",
    name: "Horreur Lovecraftienne",
    backgroundImage: "",
    colors: {
      bg: "bg-amber-50", primary: "bg-amber-800", text: "text-amber-900",
      textLight: "text-amber-700", card: "bg-amber-100", hover: "hover:bg-amber-700",
      starFilled: "text-yellow-600", starEmpty: "text-gray-400", tag: "bg-amber-200 text-amber-800"
    }
  },
  {
    id: "scifi",
    name: "Science-Fiction",
    backgroundImage: "",
    colors: {
      bg: "bg-slate-950", primary: "bg-cyan-900", text: "text-cyan-100",
      textLight: "text-cyan-300", card: "bg-slate-900", hover: "hover:bg-cyan-800",
      starFilled: "text-cyan-400", starEmpty: "text-slate-700", tag: "bg-cyan-900 text-cyan-300"
    }
  }
];

const StarRating = ({ rating, label, icon, theme }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-lg">{icon}</span>
    <span className={`text-xs font-medium w-20 ${theme.textLight}`}>{label}</span>
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= rating ? theme.starFilled : theme.starEmpty} fill={s <= rating ? "currentColor" : "none"} />)}
    </div>
  </div>
);

const BookPage = ({ scenario, theme, side, onNextCampaign, onPreviousCampaign, hasNextCampaign, hasPreviousCampaign, onAddToCart, onDownloadFree, saga }) => {
  const { t } = useLanguage();
  const colors = theme.colors;
  
  if (side === 'left') {
    return (
      <div className="w-full h-full p-8 pr-4 flex flex-col">
        <div className="mb-4 relative flex-grow">
          <img src={scenario.imageUrl} alt={scenario.displayName} className="w-full h-full object-cover rounded border-4 border-amber-800 shadow-lg"/>
        </div>
        <h2 className={`text-2xl font-bold mb-4 ${colors.text} font-serif`}>{scenario.displayName}</h2>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className={colors.textLight} />
          <span className={`text-base font-semibold ${colors.textLight}`}>{scenario.duration}</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <StarRating rating={scenario.ratings.ambiance} label={t('ratings.ambiance')} icon={adminConfig.ratingIcons.ambiance} theme={colors} />
            <StarRating rating={scenario.ratings.complexite} label={t('ratings.complexity')} icon={adminConfig.ratingIcons.complexite} theme={colors} />
          </div>
          <div>
            <StarRating rating={scenario.ratings.combat} label={t('ratings.combat')} icon={adminConfig.ratingIcons.combat} theme={colors} />
            <StarRating rating={scenario.ratings.enquete} label={t('ratings.investigation')} icon={adminConfig.ratingIcons.enquete} theme={colors} />
          </div>
        </div>
        {hasPreviousCampaign && (
          <button onClick={onPreviousCampaign} className="mt-auto bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2">
            <ChevronLeft size={20} />{t('book.previousCampaign')}
          </button>
        )}
      </div>
    );
  } else {
    return (
      <div className="w-full h-full p-8 pl-4 flex flex-col">
        <div className="mb-6 flex-grow">
          <h3 className={`text-lg font-bold mb-3 ${colors.text}`}>{t('book.summary')}</h3>
          <p className={`text-base ${colors.textLight} leading-relaxed`}>{scenario.description}</p>
        </div>
        <div className="mb-4">
          <h3 className={`text-sm font-bold mb-1 ${colors.text}`}>{t('book.author')}</h3>
          <p className={`text-base ${colors.textLight}`}>{scenario.author}</p>
        </div>
        <div className="mb-6">
          <h3 className={`text-sm font-bold mb-2 ${colors.text}`}>{t('book.tags')}</h3>
          <div className="flex flex-wrap gap-2">
            {scenario.tags.map((tag, i) => <span key={i} className={`${colors.tag} px-3 py-1 rounded-full text-sm`}>{tag}</span>)}
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          {scenario.isFree ? (
            <div className="bg-green-100 border-2 border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-green-900">📥 {t('book.individualScenario')}</span>
                <span className="text-2xl font-bold text-green-800">{t('book.free')}</span>
              </div>
              <button
                onClick={() => onDownloadFree(scenario.pdfUrl, scenario.displayName)}
                className="w-full bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2 font-semibold">
                <Download size={18} />{t('book.downloadPdf')}
              </button>
            </div>
          ) : (
            <div className="bg-amber-200 border-2 border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-amber-900">🛒 {t('book.individualScenario')}</span>
                <span className="text-2xl font-bold text-amber-800">{scenario.price.toFixed(2)} €</span>
              </div>
              <button 
                onClick={() => onAddToCart({ type: 'scenario', item: scenario, saga })}
                className={`w-full ${colors.primary} text-white px-4 py-2 rounded ${colors.hover} flex items-center justify-center gap-2 font-semibold`}>
                <ShoppingCart size={18} />{t('book.addToCart')}
              </button>
            </div>
          )}

          {saga.isFree ? (
            <div className="bg-green-100 border-2 border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-green-900">📥 {t('book.fullCampaign')}</span>
                <span className="text-2xl font-bold text-green-800">{t('book.free')}</span>
              </div>
              <p className="text-xs text-green-700 mb-2">{saga.scenarios.length} {t('book.scenariosIncluded')}</p>
              <button
                onClick={() => onDownloadFree(saga.pdfUrl, saga.name)}
                className="w-full bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2 font-semibold">
                <Download size={18} />{t('book.downloadPdf')}
              </button>
            </div>
          ) : (
            <div className="bg-amber-200 border-2 border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-amber-900">🛒 {t('book.fullCampaign')}</span>
                <span className="text-2xl font-bold text-amber-800">{saga.price.toFixed(2)} €</span>
              </div>
              <p className="text-xs text-amber-700 mb-2">{t('book.save')} {((saga.scenarios.filter(s => !s.isFree).reduce((sum, s) => sum + s.price, 0) - saga.price).toFixed(2))} €</p>
              <button 
                onClick={() => onAddToCart({ type: 'saga', item: saga })}
                className={`w-full ${colors.primary} text-white px-4 py-2 rounded ${colors.hover} flex items-center justify-center gap-2 font-semibold`}>
                <ShoppingCart size={18} />{t('book.addToCart')}
              </button>
            </div>
          )}
        </div>

        {hasNextCampaign && (
          <button onClick={onNextCampaign} className="mt-auto bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2 ml-auto">
            {t('book.nextCampaign')}<ChevronRight size={20} />
          </button>
        )}
      </div>
    );
  }
};

const CampaignEditModal = ({ saga, onSave, onClose, themes }) => {
  const [editedSaga, setEditedSaga] = useState(saga ? {
    ...saga,
    // Mapper les champs snake_case vers camelCase
    themeId: saga.themeId || saga.theme_id || 'medieval',
    pdfUrl: saga.pdfUrl || saga.pdf_url || '',
    backgroundImageUrl: saga.backgroundImageUrl || saga.background_image_url || '',
    backgroundVideoUrl: saga.backgroundVideoUrl || saga.background_video_url || '',
    isFree: saga.isFree ?? saga.is_free ?? false
  } : {
    id: Date.now(),
    name: '',
    themeId: 'medieval',
    description: '',
    price: 24.99,
    isFree: false,
    pdfUrl: '',
    backgroundImageUrl: '',
    backgroundVideoUrl: '',
    scenarios: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔧 CampaignEditModal - handleSubmit appelé avec:', editedSaga);
    try {
      await onSave(editedSaga);
      // onSave (saveCampaign) fermera le modal en cas de succès
    } catch (error) {
      // L'erreur est déjà affichée par saveCampaign, pas besoin de la réafficher
      console.error('❌ Erreur capturée dans handleSubmit:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-amber-100 border-2 md:border-4 border-amber-900 rounded-lg p-4 md:p-8 max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-3xl font-bold text-amber-900">
            {saga ? '✏️ Modifier' : '➕ Créer'} une campagne
          </h2>
          <button onClick={onClose} className="text-amber-900 hover:text-amber-700 text-xl md:text-2xl">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-amber-900 font-bold mb-2">Nom de la campagne *</label>
            <input 
              type="text" 
              required
              value={editedSaga.name}
              onChange={(e) => setEditedSaga({...editedSaga, name: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
            />
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">Thème / Section *</label>
            <select
              required
              value={editedSaga.themeId || 'medieval'}
              onChange={(e) => setEditedSaga({...editedSaga, themeId: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900">
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.id === 'medieval' && '⚔️ '}{theme.id === 'lovecraft' && '👁️ '}{theme.id === 'scifi' && '🚀 '}
                  {theme.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-amber-700 mt-1">
              Cette campagne apparaîtra dans la section sélectionnée sur la page d'accueil
            </p>
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">Description *</label>
            <textarea 
              required
              rows="4"
              value={editedSaga.description}
              onChange={(e) => setEditedSaga({...editedSaga, description: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
            />
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">URL du PDF (campagne complète)</label>
            <input 
              type="text"
              value={editedSaga.pdfUrl}
              onChange={(e) => setEditedSaga({...editedSaga, pdfUrl: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
              placeholder="/pdfs/ma-campagne.pdf"
            />
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">Image d'arrière-plan du livre</label>
            <input 
              type="text"
              value={editedSaga.backgroundImageUrl || ''}
              onChange={(e) => setEditedSaga({...editedSaga, backgroundImageUrl: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
              placeholder="https://i.imgur.com/XXXXX.jpg"
            />
            <p className="text-sm text-amber-700 mt-1">Cette image sera affichée en arrière-plan lorsque le livre est ouvert</p>
            {editedSaga.backgroundImageUrl && (
              <img 
                src={editedSaga.backgroundImageUrl} 
                alt="Preview" 
                className="mt-2 w-full h-32 object-cover rounded border-2 border-amber-700" 
              />
            )}
          </div>

          <div className="bg-purple-50 border-2 border-purple-700 rounded-lg p-4">
            <label className="block text-purple-900 font-bold mb-2">🎬 Vidéo d'arrière-plan (optionnel - remplace l'effet de brouillard)</label>
            <input 
              type="text"
              value={editedSaga.backgroundVideoUrl || ''}
              onChange={(e) => setEditedSaga({...editedSaga, backgroundVideoUrl: e.target.value})}
              className="w-full px-4 py-2 border-2 border-purple-700 rounded focus:outline-none focus:border-purple-900"
              placeholder="/videos/ma-video.mp4"
            />
            <p className="text-sm text-purple-700 mt-2">
              💡 <strong>Vidéo en boucle :</strong> Placez votre fichier MP4 dans le dossier <code className="bg-purple-200 px-1 rounded">public/videos/</code><br/>
              Ou utilisez une URL complète : <code className="bg-purple-200 px-1 rounded">https://...</code>
            </p>
            <p className="text-xs text-purple-600 mt-1">
              ⚠️ Si une vidéo est définie, elle remplacera l'effet de particules de brouillard
            </p>
          </div>

          <div className="bg-amber-200 border-2 border-amber-700 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={editedSaga.isFree}
                onChange={(e) => setEditedSaga({
                  ...editedSaga, 
                  isFree: e.target.checked,
                  price: e.target.checked ? 0 : (editedSaga.price || 24.99)
                })}
                className="w-6 h-6 mt-1"
              />
              <div>
                <span className="text-lg font-bold text-amber-900 block">
                  📥 Téléchargement gratuit
                </span>
                <p className="text-sm text-amber-700 mt-1">
                  Si coché, cette campagne sera téléchargeable gratuitement (bouton "Télécharger PDF").<br/>
                  Si décoché, elle sera payante (bouton "Ajouter au panier").
                </p>
              </div>
            </label>
          </div>

          {!editedSaga.isFree && (
            <div>
              <label className="block text-amber-900 font-bold mb-2">Prix de la campagne complète *</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  value={editedSaga.price}
                  onChange={(e) => setEditedSaga({...editedSaga, price: parseFloat(e.target.value) || 0})}
                  className="flex-1 px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
                />
                <span className="text-amber-900 font-bold text-xl">€</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t-2 border-amber-700">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-bold">
              Annuler
            </button>
            <button 
              type="submit"
              className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold">
              💾 Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ScenarioDetailModal = ({ scenario, saga, onClose, onDownloadFree, onAddToCart }) => {
  const { t } = useLanguage();
  if (!scenario) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 md:p-4" onClick={onClose}>
      <div className="relative max-w-6xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="fixed top-2 right-2 md:top-4 md:right-4 bg-amber-800 text-white p-2 md:p-3 rounded-full hover:bg-amber-700 shadow-2xl z-50">
          <X size={24} className="md:w-8 md:h-8" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Colonne gauche - Image en grand */}
          <div className="flex items-center justify-center bg-black/50 rounded-lg p-2 md:p-4">
            <img
              src={scenario.imageUrl}
              alt={scenario.displayName}
              className="w-full max-h-[50vh] md:max-h-[85vh] object-contain rounded-lg border-2 md:border-4 border-amber-800 shadow-2xl"
            />
          </div>

          {/* Colonne droite - Détails */}
          <div className="bg-amber-100 border-2 md:border-4 border-amber-900 rounded-lg p-4 md:p-8 shadow-2xl">
            <h2 className="text-2xl md:text-4xl font-bold text-amber-900 mb-4 font-serif">{scenario.displayName}</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-amber-900 mb-2">{t('book.summary')}</h3>
              <p className="text-amber-800 leading-relaxed">{scenario.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-amber-900 mb-1">{t('book.author')}</h3>
              <p className="text-amber-800">{scenario.author}</p>
            </div>

            <div className="flex items-center gap-2 mb-4 text-amber-800">
              <Clock size={18} />
              <span className="font-semibold">{scenario.duration}</span>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-amber-900 mb-2">{t('book.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {scenario.tags.map((tag, i) => (
                  <span key={i} className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-amber-900 mb-3">{t('ratings.ambiance')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌙</span>
                  <span className="text-xs font-medium w-20 text-amber-700">{t('ratings.ambiance')}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} 
                        className={s <= scenario.ratings.ambiance ? 'text-yellow-600' : 'text-gray-400'} 
                        fill={s <= scenario.ratings.ambiance ? "currentColor" : "none"} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧩</span>
                  <span className="text-xs font-medium w-20 text-amber-700">{t('ratings.complexity')}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} 
                        className={s <= scenario.ratings.complexite ? 'text-yellow-600' : 'text-gray-400'} 
                        fill={s <= scenario.ratings.complexite ? "currentColor" : "none"} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚔️</span>
                  <span className="text-xs font-medium w-20 text-amber-700">{t('ratings.combat')}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} 
                        className={s <= scenario.ratings.combat ? 'text-yellow-600' : 'text-gray-400'} 
                        fill={s <= scenario.ratings.combat ? "currentColor" : "none"} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔍</span>
                  <span className="text-xs font-medium w-20 text-amber-700">{t('ratings.investigation')}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} 
                        className={s <= scenario.ratings.enquete ? 'text-yellow-600' : 'text-gray-400'} 
                        fill={s <= scenario.ratings.enquete ? "currentColor" : "none"} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {scenario.isFree ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadFree(scenario.pdfUrl, scenario.displayName);
                }}
                className="w-full bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-bold text-lg">
                <Download size={24} />{t('book.downloadPdf')}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-amber-900">{t('book.individualScenario')}</span>
                    <span className="text-3xl font-bold text-amber-800">{scenario.price.toFixed(2)} €</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart({ type: 'scenario', item: scenario, saga });
                  }}
                  className="w-full bg-amber-800 text-white px-6 py-4 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-bold text-lg">
                  <ShoppingCart size={24} />{t('book.addToCart')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioEditModal = ({ scenario, saga, onSave, onClose, tags }) => {
  const [editedScenario, setEditedScenario] = useState(scenario || {
    id: Date.now(),
    title: '',
    displayName: '',
    author: '',
    description: '',
    imageUrl: '',
    backgroundImageUrl: '',
    duration: '4-6 heures',
    ratings: { ambiance: 3, complexite: 3, combat: 3, enquete: 3 },
    tags: [],
    price: 9.99,
    isFree: false,
    pdfUrl: ''
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedScenario);
  };

  const addTag = () => {
    if (newTag.trim() && !editedScenario.tags.includes(newTag.trim())) {
      setEditedScenario({
        ...editedScenario,
        tags: [...editedScenario.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setEditedScenario({
      ...editedScenario,
      tags: editedScenario.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-amber-100 border-2 md:border-4 border-amber-900 rounded-lg p-4 md:p-8 max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-3xl font-bold text-amber-900">
            {scenario ? '✏️ Modifier' : '➕ Créer'} un scénario
          </h2>
          <button onClick={onClose} className="text-amber-900 hover:text-amber-700 text-xl md:text-2xl">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-bold mb-2">Titre *</label>
              <input 
                type="text" 
                required
                value={editedScenario.title}
                onChange={(e) => setEditedScenario({...editedScenario, title: e.target.value})}
                className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
                placeholder="La Maîtresse des Doigts"
              />
            </div>
            <div>
              <label className="block text-amber-900 font-bold mb-2">Nom d'affichage *</label>
              <input 
                type="text" 
                required
                value={editedScenario.displayName}
                onChange={(e) => setEditedScenario({...editedScenario, displayName: e.target.value})}
                className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
                placeholder="Chapitre I : La Maîtresse des Doigts"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-amber-900 font-bold mb-2">Auteur *</label>
              <input
                type="text"
                required
                value={editedScenario.author}
                onChange={(e) => setEditedScenario({...editedScenario, author: e.target.value})}
                className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
              />
            </div>
            <div>
              <label className="block text-amber-900 font-bold mb-2">Durée *</label>
              <input
                type="text"
                required
                value={editedScenario.duration}
                onChange={(e) => setEditedScenario({...editedScenario, duration: e.target.value})}
                className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
                placeholder="4-6 heures"
              />
            </div>
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">Description *</label>
            <textarea 
              required
              rows="4"
              value={editedScenario.description}
              onChange={(e) => setEditedScenario({...editedScenario, description: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
            />
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">URL de l'image (format 9:16)</label>
            <input 
              type="text"
              value={editedScenario.imageUrl}
              onChange={(e) => setEditedScenario({...editedScenario, imageUrl: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
              placeholder="https://i.imgur.com/XXXXX.jpg"
            />
            <p className="text-sm text-amber-700 mt-1">Image principale affichée en format vertical 9:16</p>
            {editedScenario.imageUrl && (
              <img src={editedScenario.imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded border-2 border-amber-700" />
            )}
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">Image de fond</label>
            <input 
              type="text"
              value={editedScenario.backgroundImageUrl || ''}
              onChange={(e) => setEditedScenario({...editedScenario, backgroundImageUrl: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
              placeholder="https://i.imgur.com/XXXXX.jpg"
            />
            <p className="text-sm text-amber-700 mt-1">Image affichée en arrière-plan derrière le texte de la carte (optionnel)</p>
            {editedScenario.backgroundImageUrl && (
              <img src={editedScenario.backgroundImageUrl} alt="Preview fond" className="mt-2 w-full h-32 object-cover rounded border-2 border-amber-700" />
            )}
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-2">URL du PDF</label>
            <input 
              type="text"
              value={editedScenario.pdfUrl}
              onChange={(e) => setEditedScenario({...editedScenario, pdfUrl: e.target.value})}
              className="w-full px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
              placeholder="/pdfs/mon-scenario.pdf"
            />
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-3">Notations</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['ambiance', 'complexite', 'combat', 'enquete'].map(rating => (
                <div key={rating}>
                  <label className="block text-sm text-amber-800 mb-1 capitalize">{rating}</label>
                  <input 
                    type="range"
                    min="1"
                    max="5"
                    value={editedScenario.ratings[rating]}
                    onChange={(e) => setEditedScenario({
                      ...editedScenario,
                      ratings: {...editedScenario.ratings, [rating]: parseInt(e.target.value)}
                    })}
                    className="w-full"
                  />
                  <div className="text-center text-amber-900 font-bold">{editedScenario.ratings[rating]}/5</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-amber-900 font-bold mb-3">🏷️ Tags - Sélection multiple</label>
            <p className="text-sm text-amber-700 mb-4">Sélectionnez les tags qui correspondent à votre scénario</p>
            
            {tags && Object.keys(tags).length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-amber-50 rounded-lg border-2 border-amber-700">
                {Object.entries(tags).map(([category, categoryTags]) => (
                  <div key={category} className="bg-white rounded-lg p-4 border border-amber-700">
                    <h4 className="text-lg font-bold text-amber-900 mb-3 capitalize flex items-center gap-2">
                      {category === 'genre' && '🎭'}
                      {category === 'ambiance' && '🌙'}
                      {category === 'difficulte' && '📊'}
                      {category === 'duree' && '⏱️'}
                      {category === 'type' && '📖'}
                      {category === 'theme' && '🎨'}
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryTags.map((tag) => {
                        const isSelected = editedScenario.tags.includes(tag.name);
                        return (
                          <label
                            key={tag.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-200 border-2 border-amber-700' 
                                : 'bg-gray-50 border-2 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditedScenario({
                                    ...editedScenario,
                                    tags: [...editedScenario.tags, tag.name]
                                  });
                                } else {
                                  setEditedScenario({
                                    ...editedScenario,
                                    tags: editedScenario.tags.filter(t => t !== tag.name)
                                  });
                                }
                              }}
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-semibold text-amber-900 flex items-center gap-1">
                              {tag.icon && <span>{tag.icon}</span>}
                              {tag.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-700 rounded-lg p-4 text-center">
                <p className="text-yellow-900 font-bold">⚠️ Aucun tag disponible</p>
                <p className="text-sm text-yellow-700 mt-1">Les tags sont chargés depuis Supabase</p>
              </div>
            )}
            
            {/* Tags sélectionnés */}
            <div className="mt-4">
              <p className="text-sm font-bold text-amber-900 mb-2">
                Tags sélectionnés ({editedScenario.tags.length}) :
              </p>
              <div className="flex flex-wrap gap-2">
                {editedScenario.tags.length > 0 ? (
                  editedScenario.tags.map((tag, i) => (
                    <span key={i} className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-semibold border-2 border-amber-700">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-amber-600 italic">Aucun tag sélectionné</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-amber-200 border-2 border-amber-700 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={editedScenario.isFree}
                onChange={(e) => setEditedScenario({
                  ...editedScenario, 
                  isFree: e.target.checked,
                  price: e.target.checked ? 0 : (editedScenario.price || 9.99)
                })}
                className="w-6 h-6 mt-1"
              />
              <div>
                <span className="text-lg font-bold text-amber-900 block">
                  📥 Téléchargement gratuit
                </span>
                <p className="text-sm text-amber-700 mt-1">
                  Si coché, ce scénario sera téléchargeable gratuitement.
                </p>
              </div>
            </label>
          </div>

          {!editedScenario.isFree && (
            <div>
              <label className="block text-amber-900 font-bold mb-2">Prix du scénario *</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  value={editedScenario.price}
                  onChange={(e) => setEditedScenario({...editedScenario, price: parseFloat(e.target.value) || 0})}
                  className="flex-1 px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
                />
                <span className="text-amber-900 font-bold text-xl">€</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t-2 border-amber-700">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-bold">
              Annuler
            </button>
            <button 
              type="submit"
              className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold">
              💾 Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShoppingCartPanel = ({ cart, onRemoveItem, onClose, onGoToCheckout }) => {
  const { t } = useLanguage();
  const total = cart.reduce((sum, item) => sum + (item.type === 'saga' ? item.item.price : item.item.price), 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDirectCheckout = async () => {
    setIsProcessing(true);
    try {
      // Redirection directe vers Stripe - Stripe demandera l'email lui-même
      await processCheckout(cart, {
        firstName: '',
        lastName: '',
        email: '' // Stripe demandera l'email sur sa page
      });
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(t('cart.paymentError'));
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-[450px] shadow-2xl z-50 flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}>
      {/* Header élégant */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-amber-800/20"></div>
        <div className="relative p-4 md:p-6 border-b border-amber-700/30 flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-amber-300 mb-1">{t('cart.title')}</h2>
            <p className="text-amber-500 text-sm">{cart.length} {cart.length > 1 ? t('cart.items') : t('cart.item')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-300 hover:text-amber-100 transition-colors p-2 rounded-full hover:bg-amber-900/20">
            <X size={28} />
          </button>
        </div>
      </div>
      
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-full p-8 mb-6 border border-amber-700/30">
              <ShoppingCart size={64} className="text-amber-600" />
            </div>
            <p className="text-amber-400 text-xl font-semibold mb-2">{t('cart.empty')}</p>
            <p className="text-amber-600 text-center">{t('cart.emptyMessage')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((cartItem, index) => (
              <div key={index} 
                className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-amber-700/30 rounded-xl p-5 transition-all hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-900/20">
                <div className="flex gap-4">
                  {/* Icône type */}
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl ${
                      cartItem.type === 'saga' 
                        ? 'bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-600/30' 
                        : 'bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30'
                    }`}>
                      {cartItem.type === 'saga' ? '📚' : '📖'}
                    </div>
                  </div>
                  
                  {/* Détails */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-amber-200 text-lg leading-tight">
                        {cartItem.type === 'saga' ? cartItem.item.name : cartItem.item.displayName}
                      </h3>
                      <button 
                        onClick={() => onRemoveItem(index)} 
                        className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {cartItem.type === 'scenario' && (
                      <p className="text-amber-500 text-sm mb-2 flex items-center gap-1">
                        <span className="opacity-60">{t('cart.from')}</span> {cartItem.saga.name}
                      </p>
                    )}
                    {cartItem.type === 'saga' && (
                      <p className="text-amber-500 text-sm mb-2 flex items-center gap-1">
                        <span className="text-amber-400">📦</span> {cartItem.item.scenarios.length} {t('cart.scenariosIncluded')}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        cartItem.type === 'saga'
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-600/30'
                          : 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                      }`}>
                        {cartItem.type === 'saga' ? t('cart.fullCampaign') : t('cart.singleScenario')}
                      </span>
                      <span className="text-2xl font-bold text-amber-300">
                        {(cartItem.type === 'saga' ? cartItem.item.price : cartItem.item.price).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer avec total et bouton paiement */}
      {cart.length > 0 && (
        <div className="border-t border-amber-700/30 p-6 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 rounded-xl p-5 mb-4 border border-amber-700/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-amber-400 text-lg font-semibold">{t('cart.total')}</span>
              <span className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                {total.toFixed(2)} €
              </span>
            </div>
            <p className="text-amber-600 text-xs text-right">{t('cart.vatIncluded')}</p>
          </div>
          
          <button 
            onClick={handleDirectCheckout}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:shadow-amber-900/50 transform hover:scale-[1.02] active:scale-[0.98]">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                {t('cart.redirecting')}
              </>
            ) : (
              <>
                <CreditCard size={24} />
                {t('cart.payWithStripe')}
              </>
            )}
          </button>
          
          <p className="text-center text-amber-700 text-xs mt-3">
            🔒 {t('cart.securePayment')}
          </p>
        </div>
      )}

      {/* Styles CSS pour le scrollbar personnalisé */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(217, 119, 6, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 119, 6, 0.7);
        }
      `}</style>
    </div>
  );
};

const CheckoutPage = ({ cart, onBack, onOrderComplete }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', confirmEmail: '',
    address: '', city: '', postalCode: '', country: 'France',
    cardNumber: '', cardName: '', expiryDate: '', cvv: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const total = cart.reduce((sum, item) => sum + (item.type === 'saga' ? item.item.price : item.item.price), 0);

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = t('checkout.firstNameRequired');
    if (!formData.lastName.trim()) errors.lastName = t('checkout.lastNameRequired');
    if (!formData.email.trim()) errors.email = t('checkout.emailRequired');
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t('checkout.emailInvalid');
    if (formData.email !== formData.confirmEmail) errors.confirmEmail = t('checkout.emailMismatch');
    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length !== 16) errors.cardNumber = t('checkout.cardNumberInvalid');
    if (!formData.cvv.trim() || formData.cvv.length !== 3) errors.cvv = t('checkout.cvvInvalid');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (validateForm()) {
    setIsProcessing(true);
    try {
      // Utiliser le vrai système de paiement Stripe
      await processCheckout(cart, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      // La redirection vers Stripe Checkout se fait automatiquement
    } catch (error) {
      console.error('❌ Erreur lors du paiement:', error);
      alert(t('checkout.sessionError'));
      setIsProcessing(false);
    }
  }
};

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: null });
  };

  const formatCardNumber = (value) => {
    if (!value || typeof value !== 'string') return '';
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={onBack} className="mb-6 bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2">
          <ChevronLeft size={20} />{t('checkout.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-amber-100 border-4 border-amber-900 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-6">{t('checkout.payment')}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4">{t('checkout.information')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">{t('checkout.firstName')}</label>
                    <input type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-4 py-2 border-2 rounded ${formErrors.firstName ? 'border-red-500' : 'border-amber-700'}`} />
                    {formErrors.firstName && <p className="text-red-600 text-sm mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">{t('checkout.lastName')}</label>
                    <input type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-4 py-2 border-2 rounded ${formErrors.lastName ? 'border-red-500' : 'border-amber-700'}`} />
                    {formErrors.lastName && <p className="text-red-600 text-sm mt-1">{formErrors.lastName}</p>}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-amber-900 font-bold mb-2">{t('checkout.email')}</label>
                  <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded ${formErrors.email ? 'border-red-500' : 'border-amber-700'}`} />
                  {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
                </div>
                
                <div className="mt-4">
                  <label className="block text-amber-900 font-bold mb-2">{t('checkout.confirmEmail')}</label>
                  <input type="email" value={formData.confirmEmail} onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded ${formErrors.confirmEmail ? 'border-red-500' : 'border-amber-700'}`} />
                  {formErrors.confirmEmail && <p className="text-red-600 text-sm mt-1">{formErrors.confirmEmail}</p>}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4">{t('checkout.payment')}</h2>
                <div>
                  <label className="block text-amber-900 font-bold mb-2">{t('checkout.cardNumber')}</label>
                  <input type="text" value={formData.cardNumber} onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456" maxLength="19"
                    className={`w-full px-4 py-2 border-2 rounded ${formErrors.cardNumber ? 'border-red-500' : 'border-amber-700'}`} />
                  {formErrors.cardNumber && <p className="text-red-600 text-sm mt-1">{formErrors.cardNumber}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">{t('checkout.expiration')}</label>
                    <input type="text" value={formData.expiryDate} onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/AA" maxLength="5" className="w-full px-4 py-2 border-2 border-amber-700 rounded" />
                  </div>
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">{t('checkout.cvv')}</label>
                    <input type="text" value={formData.cvv} onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substr(0, 3))}
                      placeholder="123" maxLength="3"
                      className={`w-full px-4 py-2 border-2 rounded ${formErrors.cvv ? 'border-red-500' : 'border-amber-700'}`} />
                    {formErrors.cvv && <p className="text-red-600 text-sm mt-1">{formErrors.cvv}</p>}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isProcessing}
                className="w-full bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <>{t('checkout.processing')}</> : <><CreditCard size={20} />{t('checkout.pay')} {total.toFixed(2)} €</>}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1 bg-amber-100 border-4 border-amber-900 rounded-lg p-6 sticky top-4">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">📋 {t('checkout.orderSummary')}</h2>
            <div className="space-y-3 mb-6">
              {cart.map((item, i) => (
                <div key={i} className="border-b-2 border-amber-700 pb-3">
                  <div className="font-bold text-amber-900">{item.type === 'saga' ? item.item.name : item.item.displayName}</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">{item.type === 'saga' ? `${item.item.scenarios.length} ${t('cart.scenariosIncluded')}` : t('checkout.scenario')}</span>
                    <span className="font-bold text-amber-800">{(item.type === 'saga' ? item.item.price : item.item.price).toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-amber-900 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-amber-900">{t('checkout.total')}</span>
                <span className="text-2xl font-bold text-green-700">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderConfirmationPage = ({ orderData, cart, onBackToHome }) => {
  const { t } = useLanguage();
  const total = cart.reduce((sum, item) => sum + (item.type === 'saga' ? item.item.price : item.item.price), 0);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-amber-100 border-4 border-amber-900 rounded-lg p-10 text-center shadow-2xl">
        <div className="text-green-600 mb-6"><Check size={80} className="mx-auto" strokeWidth={3} /></div>
        <h1 className="text-4xl font-bold text-amber-900 mb-4">{t('confirmation.title')}</h1>
        <p className="text-xl text-amber-700 mb-8">{t('confirmation.thankYou')} {orderData.firstName} !</p>

        <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">{t('confirmation.emailSent')}</h2>
          <p className="text-amber-800">{t('confirmation.confirmationTo')} <strong>{orderData.email}</strong></p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-amber-900 mb-4">📦 {t('confirmation.order')}</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-amber-300">
              <span>{item.type === 'saga' ? item.item.name : item.item.displayName}</span>
              <span className="font-bold">{(item.type === 'saga' ? item.item.price : item.item.price).toFixed(2)} €</span>
            </div>
          ))}
          <div className="flex justify-between pt-4 border-t-2 border-amber-700 mt-4">
            <span className="text-xl font-bold">{t('confirmation.total')}</span>
            <span className="text-2xl font-bold text-green-700">{total.toFixed(2)} €</span>
          </div>
        </div>

        <button onClick={onBackToHome} className="bg-amber-800 text-white px-8 py-4 rounded-lg hover:bg-amber-700 font-bold text-lg">
          {t('confirmation.backToHome')}
        </button>
      </div>
    </div>
  );
};

// Composant pour la page d'accueil dans l'admin
const PageAccueilTab = ({ themes, setThemes, refresh }) => {
  const [editedThemes, setEditedThemes] = useState(themes);
  const [saving, setSaving] = useState(false);

  // Synchroniser editedThemes avec themes quand themes change
  useEffect(() => {
    setEditedThemes(themes);
  }, [themes]);

  const handleSave = async (themeId) => {
    setSaving(true);
    try {
      const theme = editedThemes.find(t => t.id === themeId);
      
      // S'assurer que la valeur est soit une string, soit null
      let imageUrl = theme.backgroundImage || theme.background_image || '';
      
      // Nettoyer la valeur : convertir en string et trim
      if (typeof imageUrl === 'object') {
        console.error('imageUrl est un objet:', imageUrl);
        imageUrl = '';
      }
      
      imageUrl = String(imageUrl).trim();
      
      // Si vide, mettre null
      if (imageUrl === '') {
        imageUrl = null;
      }
      
      console.log('Sauvegarde de l\'image pour', themeId, ':', imageUrl);
      
      await supabaseService.updateTheme(themeId, { backgroundImage: imageUrl });
      
      // Recharger TOUTES les données depuis Supabase
      await refresh();
      
      alert('✅ Image d\'arrière-plan sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (themeId, newUrl) => {
    setEditedThemes(prev => prev.map(t => 
      t.id === themeId ? { ...t, backgroundImage: newUrl, background_image: newUrl } : t
    ));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-amber-900">🏠 Configuration de la Page d'Accueil</h2>
        <p className="text-amber-700 mt-2">Personnalisez les images d'arrière-plan des sections de thèmes</p>
      </div>

      <div className="space-y-6">
        {editedThemes.map((theme) => (
          <div key={theme.id} className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">
                {theme.id === 'medieval' && '⚔️'}
                {theme.id === 'lovecraft' && '👁️'}
                {theme.id === 'scifi' && '🚀'}
              </span>
              <h3 className="text-2xl font-bold text-amber-900">{theme.name}</h3>
            </div>

            <div className="mb-4">
              <label className="block text-amber-900 font-bold mb-2">URL de l'image d'arrière-plan</label>
              <input 
                type="text"
                value={theme.backgroundImage}
                onChange={(e) => handleChange(theme.id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg focus:outline-none focus:border-amber-900"
                placeholder="https://i.imgur.com/XXXXX.jpg"
              />
              <p className="text-sm text-amber-700 mt-1">
                Cette image sera affichée en arrière-plan (flou sombre) sur la page d'accueil
              </p>
            </div>

            <button
              onClick={() => handleSave(theme.id)}
              disabled={saving}
              className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold mb-4 disabled:opacity-50">
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder cette image'}
            </button>

            {theme.backgroundImage && (
              <div className="relative">
                <p className="text-sm font-bold text-amber-900 mb-2">Aperçu :</p>
                <div className="relative h-48 rounded-lg overflow-hidden border-2 border-amber-700">
                  <img 
                    src={theme.backgroundImage} 
                    alt={`Fond ${theme.name}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="text-center">
                      <h4 className={`text-3xl font-bold mb-2 ${
                        theme.id === 'medieval' ? 'text-amber-300' : 
                        theme.id === 'lovecraft' ? 'text-emerald-400' : 
                        'text-cyan-400'
                      }`}>
                        {theme.name}
                      </h4>
                      <p className={`text-lg ${
                        theme.id === 'medieval' ? 'text-amber-200' : 
                        theme.id === 'lovecraft' ? 'text-emerald-300' : 
                        'text-cyan-300'
                      }`}>
                        Cliquez pour explorer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border-2 border-blue-700 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">💡 Conseils :</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Les images seront affichées avec un effet de flou et d'assombrissement</li>
          <li>Au survol, l'image devient plus nette avec un léger effet de zoom</li>
          <li>Utilisez des images de haute qualité (minimum 1920x1080)</li>
          <li>Uploadez vos images sur <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Imgur.com</a> pour obtenir des URLs stables</li>
        </ul>
      </div>
    </div>
  );
};


// Composant pour afficher les soumissions depuis Supabase
const SubmissionsTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les soumissions au montage
  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getSubmissions();
      setSubmissions(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement soumissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette soumission ?')) return;
    
    try {
      await supabaseService.deleteSubmission(id);
      await loadSubmissions(); // Recharger la liste
      alert('✅ Soumission supprimée avec succès');
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('❌ Erreur lors de la suppression de la soumission');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await supabaseService.updateSubmissionStatus(id, newStatus);
      await loadSubmissions(); // Recharger la liste
      alert(`✅ Statut mis à jour : ${newStatus}`);
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      alert('❌ Erreur lors de la mise à jour du statut');
    }
  };

  const handleDownload = async (pdfUrl) => {
    try {
      // Télécharger le PDF
      const blob = await supabaseService.downloadSubmissionPDF(pdfUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfUrl.split('/').pop() || 'submission.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      alert('❌ Erreur lors du téléchargement du PDF');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl text-amber-900 font-bold">Chargement des soumissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-700 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-xl text-red-900 font-bold mb-2">Erreur de chargement</p>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadSubmissions}
          className="mt-4 bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-bold">
          🔄 Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-amber-900">📥 Soumissions en Attente</h2>
          <p className="text-amber-700 mt-2">
            Gérez les propositions de scénarios ({submissions.length} soumission{submissions.length > 1 ? 's' : ''})
          </p>
        </div>
        <button 
          onClick={loadSubmissions}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-bold flex items-center gap-2">
          🔄 Actualiser
        </button>
      </div>
      
      {submissions.length === 0 ? (
        <div className="bg-amber-50 p-8 rounded-lg border-2 border-amber-700 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl text-amber-900 font-bold mb-2">Aucune soumission</p>
          <p className="text-amber-700">Les propositions apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-amber-900">
                      {submission.scenario_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      submission.status === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                      submission.status === 'approved' ? 'bg-green-200 text-green-900' :
                      'bg-red-200 text-red-900'
                    }`}>
                      {submission.status === 'pending' && '⏳ En attente'}
                      {submission.status === 'approved' && '✅ Approuvé'}
                      {submission.status === 'rejected' && '❌ Rejeté'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-sm text-amber-700 font-bold">👤 Auteur :</span>
                      <span className="text-amber-900 ml-2">{submission.author}</span>
                    </div>
                    <div>
                      <span className="text-sm text-amber-700 font-bold">📧 Email :</span>
                      <span className="text-amber-900 ml-2">{submission.email}</span>
                    </div>
                    <div>
                      <span className="text-sm text-amber-700 font-bold">📄 Fichier :</span>
                      <span className="text-amber-900 ml-2">{submission.pdf_filename}</span>
                    </div>
                    <div>
                      <span className="text-sm text-amber-700 font-bold">📅 Date :</span>
                      <span className="text-amber-900 ml-2">
                        {new Date(submission.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-amber-700 rounded p-3 mb-3">
                    <span className="text-sm text-amber-700 font-bold">📝 Résumé :</span>
                    <p className="text-amber-900 mt-1">{submission.summary}</p>
                  </div>

                  {submission.admin_notes && (
                    <div className="bg-blue-50 border border-blue-700 rounded p-3">
                      <span className="text-sm text-blue-700 font-bold">💬 Notes admin :</span>
                      <p className="text-blue-900 mt-1">{submission.admin_notes}</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleDelete(submission.id)}
                  className="ml-4 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-amber-700">
                <button 
                  onClick={() => handleDownload(submission.pdf_url)}
                  className="flex-1 bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-600 font-bold flex items-center justify-center gap-2">
                  <Download size={18} />Télécharger PDF
                </button>
                <a 
                  href={`mailto:${submission.email}?subject=Re: ${submission.scenario_name}`}
                  className="flex-1 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 text-center font-bold">
                  📧 Répondre
                </a>
                {submission.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(submission.id, 'approved')}
                      className="flex-1 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 font-bold">
                      ✅ Approuver
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(submission.id, 'rejected')}
                      className="flex-1 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600 font-bold">
                      ❌ Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  // i18n
  const { language, toggleLanguage, t } = useLanguage();

  // État pour le preloader
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderFading, setPreloaderFading] = useState(false);
  
  // Charger les données depuis Supabase
  const { campaigns, themes: supabaseThemes, siteSettings: supabaseSiteSettings, tags, loading, error, refresh } = useSupabaseData();
  
  // État pour l'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Gérer le preloader au chargement initial
  useEffect(() => {
    // Vérifier si on a déjà vu le preloader dans cette session
    const hasSeenPreloader = sessionStorage.getItem('hasSeenPreloader');

    // TIMEOUT DE SÉCURITÉ : Forcer la disparition après 5 secondes max
    const maxLoadingTimer = setTimeout(() => {
      console.warn('⏱️ Timeout preloader : masquage forcé après 5s');
      setPreloaderFading(true);
      setTimeout(() => {
        setShowPreloader(false);
        sessionStorage.setItem('hasSeenPreloader', 'true');
      }, 1000);
    }, 5000);

    if (hasSeenPreloader && !loading) {
      // Si déjà vu ET données chargées, ne pas afficher le preloader
      clearTimeout(maxLoadingTimer);
      setShowPreloader(false);
    } else if (!loading) {
      // Les données sont chargées, commencer l'animation de sortie
      clearTimeout(maxLoadingTimer);

      const fadeTimer = setTimeout(() => {
        setPreloaderFading(true);
      }, 500); // Commence à disparaître après 0.5s

      const hideTimer = setTimeout(() => {
        setShowPreloader(false);
        sessionStorage.setItem('hasSeenPreloader', 'true');
      }, 1500); // Disparaît complètement après 1.5s

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => {
      clearTimeout(maxLoadingTimer);
    };
  }, [loading]);
  
  // Vérifier l'authentification Supabase au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Vérifier le cache d'abord
          const cachedAdminStatus = sessionStorage.getItem(`admin_status_${session.user.id}`);
          
          if (cachedAdminStatus !== null) {
            // Utiliser le cache pour une réponse instantanée
            setIsAuthenticated(cachedAdminStatus === 'true');
            setAuthLoading(false);
          } else {
            // Vérifier si l'utilisateur est admin dans la base
            const { data: adminCheck } = await supabase
              .from('admin_users')
              .select('*')
              .eq('email', session.user.email)
              .single();
            
            const isAdmin = !!adminCheck;
            setIsAuthenticated(isAdmin);
            
            // Mettre en cache pour 1 heure
            sessionStorage.setItem(`admin_status_${session.user.id}`, isAdmin.toString());
            setAuthLoading(false);
          }
        } else {
          setIsAuthenticated(false);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        setIsAuthenticated(false);
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') {
        // Nettoyer le cache lors de la déconnexion
        sessionStorage.clear();
        setIsAuthenticated(false);
      } else if (session?.user) {
        // Vérifier le cache ou la base
        const cachedAdminStatus = sessionStorage.getItem(`admin_status_${session.user.id}`);
        
        if (cachedAdminStatus !== null) {
          setIsAuthenticated(cachedAdminStatus === 'true');
        } else {
          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          const isAdmin = !!adminCheck;
          setIsAuthenticated(isAdmin);
          sessionStorage.setItem(`admin_status_${session.user.id}`, isAdmin.toString());
        }
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Utiliser les données Supabase avec fallback
  const [sagas, setSagas] = useState([]);
  const [themes, setThemes] = useState(initialThemesData);
  
  // Synchroniser avec les données Supabase
  useEffect(() => {
    if (campaigns && campaigns.length >= 0) {
      setSagas(campaigns);
    }
  }, [campaigns]);
  
  useEffect(() => {
    if (supabaseThemes && supabaseThemes.length > 0) {
      setThemes(supabaseThemes);
    }
  }, [supabaseThemes]);
  
  // Charger les paramètres du site (logo, etc.)
  const [siteSettings, setSiteSettings] = useState(() => {
    const savedSettings = localStorage.getItem('le-codex-site-settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      siteName: 'Le Codex',
      logoUrl: '',
      tagline: 'Bibliothèque de scénarios JDR'
    };
  });
  
  // Sauvegarder les paramètres du site
  useEffect(() => {
    localStorage.setItem('le-codex-site-settings', JSON.stringify(siteSettings));
  }, [siteSettings]);
  
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [showBook, setShowBook] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentSagaIndex, setCurrentSagaIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'detail'
  const [adminTab, setAdminTab] = useState('campagnes');
  const [statsTab, setStatsTab] = useState('general');
  const [filterType, setFilterType] = useState('all');
  const [showCampaignMenu, setShowCampaignMenu] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingSaga, setEditingSaga] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [selectedSagaIdForScenarios, setSelectedSagaIdForScenarios] = useState(null);
  const [clickedButtons, setClickedButtons] = useState({});
  const [viewingScenario, setViewingScenario] = useState(null);
  const [searchTag, setSearchTag] = useState('');
  
  // Fonction pour obtenir tous les scénarios d'un thème avec leur campagne d'origine
  const getAllScenariosForTheme = (themeId) => {
    const themeCampaigns = sagas.filter(s => {
      const sagaThemeId = String(s.themeId || '').trim().toLowerCase();
      const targetThemeId = String(themeId || '').trim().toLowerCase();
      return sagaThemeId === targetThemeId;
    });
    
    const allScenarios = [];
    themeCampaigns.forEach(campaign => {
      if (campaign.scenarios && campaign.scenarios.length > 0) {
        campaign.scenarios.forEach(scenario => {
          allScenarios.push({
            ...scenario,
            campaignName: campaign.name,
            campaignId: campaign.id,
            saga: campaign
          });
        });
      }
    });
    
    return allScenarios;
  };
  
  // Fonction pour filtrer les scénarios par tag
  const filterScenariosByTag = (scenarios, tag) => {
    if (!tag || tag.trim() === '') return scenarios;
    
    const searchTerm = tag.trim().toLowerCase();
    return scenarios.filter(scenario => {
      if (!scenario.tags || scenario.tags.length === 0) return false;
      return scenario.tags.some(t => t.toLowerCase().includes(searchTerm));
    });
  };
  
  // Sauvegarder les sagas dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('le-codex-sagas', JSON.stringify(sagas));
  }, [sagas]);
  
  // Sauvegarder les thèmes dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('le-codex-themes', JSON.stringify(themes));
  }, [themes]);
  
  const selectedSaga = sagas[currentSagaIndex];
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  const openBook = (theme) => {
    // Trouver la première campagne du thème sélectionné avec filtrage strict
    const themeCampaigns = sagas.filter(s => {
      const sagaThemeId = String(s.themeId || '').trim().toLowerCase();
      const targetThemeId = String(theme.id || '').trim().toLowerCase();
      return sagaThemeId === targetThemeId;
    });
    
    if (themeCampaigns.length > 0) {
      const firstCampaignIndex = sagas.findIndex(s => s.id === themeCampaigns[0].id);
      setCurrentSagaIndex(firstCampaignIndex);
      setShowBook(true);
    } else {
      // Aucune campagne dans cette section
      setShowBook(true);
      setCurrentSagaIndex(-1);
    }
  };

  const closeBook = () => {
    setShowBook(false);
    setCurrentPage('home');
  };

  const nextCampaign = () => {
    if (currentSagaIndex < sagas.length - 1) {
      setCurrentSagaIndex(currentSagaIndex + 1);
      setCurrentScenario(0);
    }
  };

  const previousCampaign = () => {
    if (currentSagaIndex > 0) {
      setCurrentSagaIndex(currentSagaIndex - 1);
      setCurrentScenario(0);
    }
  };

  const addToCart = (item) => {
    // Animation du bouton cliqué
    const buttonId = `${item.type}-${item.item.id}`;
    setClickedButtons(prev => ({ ...prev, [buttonId]: true }));
    
    // Retirer l'animation après 1 seconde
    setTimeout(() => {
      setClickedButtons(prev => {
        const newState = { ...prev };
        delete newState[buttonId];
        return newState;
      });
    }, 1000);

    const exists = cart.some(cartItem => {
      if (item.type === 'saga' && cartItem.type === 'saga') return cartItem.item.id === item.item.id;
      if (item.type === 'scenario' && cartItem.type === 'scenario') return cartItem.item.id === item.item.id;
      return false;
    });
    if (!exists) {
      setCart([...cart, item]);
      setShowCart(true);
    } else {
      // Déjà dans le panier - montrer le panier
      setShowCart(true);
    }
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
  const goToCheckout = () => { setShowCart(false); setCurrentPage('checkout'); };
  const handleOrderComplete = (formData) => { setOrderData(formData); setCurrentPage('confirmation'); };
  const backToHome = () => { setCart([]); setOrderData(null); setCurrentPage('home'); };
  
  const handleDownloadFree = async (pdfUrl, name) => {
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      alert(t('download.pdfUnavailable'));
      return;
    }

    console.log('🔍 Tentative téléchargement:', { pdfUrl, name });

    try {
      // Si c'est une URL Supabase Storage complète, extraire le chemin
      let filePath = pdfUrl;

      if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
        console.log('⚠️ URL complète détectée - extraction du chemin...');

        // Vérifier si c'est une URL Supabase Storage
        if (pdfUrl.includes('supabase.co/storage/v1/object/')) {
          // Extraire le chemin après /object/public/bucket-name/ ou /object/sign/bucket-name/
          const match = pdfUrl.match(/\/object\/(public|sign)\/([^/]+)\/(.+)/);
          if (match && match[3]) {
            filePath = match[3].split('?')[0]; // Enlever les query params
            console.log('📂 Chemin extrait:', filePath);
          } else {
            console.error('❌ Format URL Supabase non reconnu:', pdfUrl);
            alert(t('download.unsupportedUrl'));
            return;
          }
        } else {
          // Si ce n'est pas une URL Supabase, ouvrir directement (lien externe)
          console.log('🌐 URL externe, ouverture directe');
          window.open(pdfUrl, '_blank');
          return;
        }
      }

      console.log('🔐 Génération URL signée depuis bucket "pdfs"...');

      // Générer une URL signée fraîche depuis Supabase Storage
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(filePath, 300); // 5 minutes

      if (error) {
        console.error('❌ Erreur génération URL signée:', error);
        console.error('Details:', { pdfUrl, errorMessage: error.message, errorDetails: error });
        alert(`Erreur: ${error.message || 'Impossible de générer le lien de téléchargement'}`);
        return;
      }

      if (data?.signedUrl) {
        console.log('✅ URL signée générée:', data.signedUrl);
        // Créer un lien temporaire et le cliquer pour télécharger
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = `${name}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('❌ Pas de signedUrl dans la réponse:', data);
        alert(t('download.linkGenerationError'));
      }
    } catch (err) {
      console.error('❌ Exception téléchargement:', err);
      alert(`Erreur: ${err.message || 'Veuillez réessayer'}`);
    }
  };

  const saveCampaign = async (campaignData) => {
    // Valider et nettoyer le themeId
    const validThemeIds = ['medieval', 'lovecraft', 'scifi'];
    const cleanThemeId = String(campaignData.themeId || 'medieval').trim().toLowerCase();
    const finalThemeId = validThemeIds.includes(cleanThemeId) ? cleanThemeId : 'medieval';
    
    const validCampaign = {
      ...campaignData,
      themeId: finalThemeId
    };
    
    // Ne PAS inclure l'ID pour une nouvelle campagne (Supabase le génère automatiquement)
    if (editingSaga) {
      validCampaign.id = campaignData.id; // Garder l'ID existant pour la modification
    }
    
    try {
      if (editingSaga) {
        // Modifier dans Supabase
        await supabaseService.updateCampaign(validCampaign.id, validCampaign);
      } else {
        // Créer dans Supabase (sans ID, Supabase le génère)
        await supabaseService.createCampaign(validCampaign);
      }
      
      // Recharger les données depuis Supabase
      await refresh();
      
      // Fermer le modal et réinitialiser l'état
      setShowCampaignModal(false);
      setEditingSaga(null);
      alert('✅ Campagne sauvegardée avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde campagne:', error);
      alert('❌ Erreur lors de la sauvegarde de la campagne: ' + error.message);
      throw error; // Relancer l'erreur pour que handleSubmit sache qu'il y a eu un problème
    }
  };

  const deleteCampaign = async (id) => {
    if (confirm('Supprimer cette campagne ?')) {
      try {
        await supabaseService.deleteCampaign(id);
        // Le hook useSupabaseData va recharger automatiquement
      } catch (error) {
        console.error('Erreur suppression campagne:', error);
        alert('❌ Erreur lors de la suppression de la campagne');
      }
    }
  };

  const saveScenario = async (scenarioData) => {
    if (!selectedSagaIdForScenarios) return;

    try {
      if (editingScenario) {
        // Modifier le scénario existant dans Supabase
        // updateScenario attend : (scenarioId, updates)
        await supabaseService.updateScenario(
          scenarioData.id,
          scenarioData
        );
      } else {
        // Ajouter un nouveau scénario dans Supabase
        // createScenario attend : (campaignId, scenario)
        await supabaseService.addScenario(
          selectedSagaIdForScenarios,
          scenarioData
        );
      }
      
      setShowScenarioModal(false);
      setEditingScenario(null);
      // Recharger manuellement les données
      await refresh();
      alert('✅ Scénario sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde scénario:', error);
      alert('❌ Erreur lors de la sauvegarde du scénario: ' + error.message);
    }
  };

  const deleteScenario = async (sagaId, scenarioId) => {
    if (confirm('Supprimer ce scénario ?')) {
      try {
        // deleteScenario attend uniquement : (scenarioId)
        await supabaseService.deleteScenario(scenarioId);
        // Recharger manuellement les données
        await refresh();
        alert('✅ Scénario supprimé avec succès !');
      } catch (error) {
        console.error('Erreur suppression scénario:', error);
        alert('❌ Erreur lors de la suppression du scénario: ' + error.message);
      }
    }
  };

  const saveThemeBackgroundImage = async (themeId, newImageUrl) => {
    try {
      await supabaseService.updateTheme(themeId, { backgroundImage: newImageUrl });
      // Le hook useSupabaseData va recharger automatiquement
    } catch (error) {
      console.error('Erreur mise à jour thème:', error);
      alert('❌ Erreur lors de la mise à jour du thème');
    }
  };

  const cartItemCount = cart.length;

  // Fonction pour réinitialiser les données
  const resetData = () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible et supprimera toutes les campagnes.')) {
      // Supprimer TOUTES les clés liées à l'application
      localStorage.clear();
      
      // Réinitialiser avec un site vide
      const cleanThemes = initialThemesData;
      const cleanSagas = [];
      
      // Sauvegarder immédiatement les données propres
      localStorage.setItem('le-codex-sagas', JSON.stringify(cleanSagas));
      localStorage.setItem('le-codex-themes', JSON.stringify(cleanThemes));
      localStorage.setItem('le-codex-site-settings', JSON.stringify({
        siteName: 'Le Codex',
        logoUrl: '',
        tagline: 'Bibliothèque de scénarios JDR'
      }));
      
      alert('✅ Données réinitialisées avec succès ! Le site est maintenant vide.');
      
      // Forcer le rechargement complet
      window.location.href = window.location.href.split('?')[0];
    }
  };

  return (
    <>
      {/* PRELOADER - Apparaît au premier chargement */}
      {showPreloader && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: '#1b191a'
          }}
        >
          {/* Logo vidéo centré */}
          <video 
            src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Logo_8.mp4"
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-contain transition-opacity duration-1000 ${
              preloaderFading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      )}
      
      {/* CONTENU PRINCIPAL - Masqué tant que le preloader est actif */}
      <div className={`min-h-screen transition-opacity duration-500 ${
        showPreloader ? 'opacity-0' : 'opacity-100'
      }`} style={{ backgroundColor: '#1b191a' }}>
      {showCampaignModal && (
        <CampaignEditModal saga={editingSaga} themes={themes} onSave={saveCampaign}
          onClose={() => { setShowCampaignModal(false); setEditingSaga(null); }} />
      )}

      {showScenarioModal && selectedSagaIdForScenarios && (
        <ScenarioEditModal 
          scenario={editingScenario} 
          saga={sagas.find(s => s.id === selectedSagaIdForScenarios)}
          onSave={saveScenario}
          onClose={() => { setShowScenarioModal(false); setEditingScenario(null); }}
          tags={tags}
        />
      )}

      {!showBook && currentPage !== 'checkout' && currentPage !== 'confirmation' && (
        <nav className="fixed top-0 left-0 right-0 z-50 shadow-2xl relative overflow-hidden">
          {/* Image de fond avec texture */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://cdn.midjourney.com/84d84b34-eb75-4cb1-badf-b1627effd26d/0_3.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.3) contrast(1.2)'
            }}
          ></div>
          
          {/* Overlay gradient optimisé pour intégration logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80"></div>
          
          {/* Effet de vignette pour fondre les bords */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(15, 23, 42, 0.4) 70%)'
          }}></div>
          
          {/* Barre lumineuse animée en haut */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60"></div>
          
          <div className="max-w-7xl mx-auto px-2 md:px-6 py-1.5 md:py-3 relative z-10">
            <div className="flex items-center justify-between gap-1 md:gap-8">
              {/* Logo et titre */}
              <button
                onClick={() => setCurrentPage('home')}
                className="group flex items-center gap-1.5 md:gap-4 hover:scale-105 transition-all duration-300 flex-shrink-0">
                {/* Container du logo avec bordure */}
                <div className="relative">
                  {siteSettings.logoUrl ? (
                    <img
                      src={siteSettings.logoUrl}
                      alt={siteSettings.siteName}
                      className="h-8 w-8 md:h-28 md:w-28 object-contain rounded md:rounded-xl border md:border-4 border-amber-600 group-hover:border-amber-400 transition-all duration-300 bg-slate-900/50"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="text-xl md:text-6xl p-0.5 md:p-2 rounded md:rounded-xl border md:border-4 border-amber-600 group-hover:border-amber-400 transition-all duration-300 bg-slate-900/50">📚</div>
                  )}
                </div>

                {/* Texte */}
                <div className="flex flex-col items-start">
                  <span className="text-sm md:text-5xl font-black bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:via-amber-100 group-hover:to-amber-200 transition-all duration-300 tracking-tight" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                    {siteSettings.siteName}
                  </span>
                  {siteSettings.tagline && (
                    <span className="text-xs md:text-sm text-amber-500/80 group-hover:text-amber-400/90 transition-colors duration-300 font-medium hidden md:block">
                      {siteSettings.tagline}
                    </span>
                  )}
                </div>
              </button>

              {/* Navigation centrale - cachee sur mobile */}
              <div className="hidden md:flex gap-6 lg:gap-12 items-center flex-1 justify-center">
                {['home', 'submit', 'admin', 'stats', 'about']
                  .filter(page => {
                    if ((page === 'admin' || page === 'stats') && !isAuthenticated) {
                      return false;
                    }
                    return true;
                  })
                  .map(page => {
                    const isActive = currentPage === page;
                    const icons = {
                      home: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Tavern%20logo_wthback.png',
                      submit: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Feather%20logo_wthback.png',
                      admin: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Gear%20logo_wthback.png',
                      stats: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Book%20logo_wthback.png',
                      about: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Scroll%20logo_wthback.png'
                    };
                    const labels = {
                      home: t('nav.home'),
                      submit: t('nav.submit'),
                      admin: t('nav.admin'),
                      stats: t('nav.stats'),
                      about: t('nav.about')
                    };
                    
                    return (
                      <button 
                        key={page} 
                        onClick={() => setCurrentPage(page)}
                        className="nav-button group relative px-5 py-3.5 font-bold text-lg transition-colors duration-300"
                        data-active={isActive}>
                        <span className={`flex items-center gap-3 transition-colors duration-300 whitespace-nowrap ${
                          isActive ? 'text-amber-300' : 'text-amber-300/70 group-hover:text-amber-200'
                        }`}>
                          <img src={icons[page]} alt={labels[page]} className="w-8 h-8 object-contain" />
                          <span>{labels[page]}</span>
                        </span>
                        
                        {/* Ligne élégante qui s'élargit depuis le centre */}
                        <span className={`
                          absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-amber-400
                          transition-all duration-300 ease-out
                          ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
                        `}></span>
                      </button>
                    );
                  })}
              </div>

              {/* Boutons d'action à droite */}
              <div className="flex gap-1.5 md:gap-3 items-center flex-shrink-0">
                {/* Bouton Langue */}
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-amber-600/30 hover:border-amber-400/50 transition-all duration-300 transform hover:scale-105 text-lg md:text-xl"
                  title={language === 'fr' ? 'Switch to English' : 'Passer en français'}
                >
                  {language === 'fr' ? '🇬🇧' : '🇫🇷'}
                </button>
                {/* Bouton Panier */}
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative group px-2 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-semibold flex items-center gap-1 md:gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  <ShoppingCart size={16} className="md:w-5 md:h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline text-sm md:text-base">{t('nav.cart')}</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center animate-pulse shadow-lg">
                      {cartItemCount}
                    </span>
                  )}
                </button>

                {/* Bouton Déconnexion - caché sur mobile (dans le menu) */}
                {isAuthenticated && (
                  <button
                    onClick={async () => {
                      if (confirm(t('nav.logoutConfirm'))) {
                        await supabase.auth.signOut();
                        setIsAuthenticated(false);
                        setCurrentPage('home');
                        window.location.href = '/';
                      }
                    }}
                    className="hidden md:flex px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-red-900/50"
                    title={t('nav.logoutTitle')}>
                    <Lock size={18} />
                    <span className="hidden lg:inline">{t('nav.logout')}</span>
                  </button>
                )}

                {/* Bouton Menu Hamburger - visible sur mobile uniquement */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white transition-all duration-300">
                  <Menu size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Ligne de séparation subtile */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
        </nav>
      )}

      {/* Sidebar Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Overlay sombre */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header sidebar */}
            <div className="flex items-center justify-between p-4 border-b border-amber-600/30">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Cinzel', serif" }}>{t('nav.menu')}</span>
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-lg"
                  title={language === 'fr' ? 'Switch to English' : 'Passer en français'}
                >
                  {language === 'fr' ? '🇬🇧' : '🇫🇷'}
                </button>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Liens de navigation */}
            <nav className="p-4 space-y-2">
              {['home', 'submit', 'admin', 'stats', 'about']
                .filter(page => {
                  if ((page === 'admin' || page === 'stats') && !isAuthenticated) {
                    return false;
                  }
                  return true;
                })
                .map(page => {
                  const isActive = currentPage === page;
                  const icons = {
                    home: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Tavern%20logo_wthback.png',
                    submit: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Feather%20logo_wthback.png',
                    admin: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Gear%20logo_wthback.png',
                    stats: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Book%20logo_wthback.png',
                    about: 'https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Scroll%20logo_wthback.png'
                  };
                  const labels = {
                    home: t('nav.home'),
                    submit: t('nav.submit'),
                    admin: t('nav.admin'),
                    stats: t('nav.statistics'),
                    about: t('nav.about')
                  };

                  return (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                          : 'text-amber-100/80 hover:bg-slate-700/50 hover:text-amber-200'
                      }`}>
                      <img src={icons[page]} alt={labels[page]} className="w-7 h-7 object-contain" />
                      <span className="font-semibold">{labels[page]}</span>
                    </button>
                  );
                })}

              {/* Bouton Déconnexion dans le menu mobile */}
              {isAuthenticated && (
                <button
                  onClick={async () => {
                    if (confirm(t('nav.logoutConfirm'))) {
                      await supabase.auth.signOut();
                      setIsAuthenticated(false);
                      setCurrentPage('home');
                      setMobileMenuOpen(false);
                      window.location.href = '/';
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200 mt-4 border border-red-500/30">
                  <Lock size={20} />
                  <span className="font-semibold">{t('nav.logout')}</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {showCart && currentPage !== 'checkout' && currentPage !== 'confirmation' && (
        <ShoppingCartPanel cart={cart} onRemoveItem={removeFromCart} onClose={() => setShowCart(false)} onGoToCheckout={goToCheckout} />
      )}

      <div>
        {currentPage === 'confirmation' && orderData && (
          <OrderConfirmationPage orderData={orderData} cart={cart} onBackToHome={backToHome} />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage cart={cart} onBack={() => { setCurrentPage('home'); setShowCart(true); }} onOrderComplete={handleOrderComplete} />
        )}

        {/* PAGE ACCUEIL */}
        {!showBook && currentPage === 'home' && (
          <div className="min-h-screen flex flex-col md:flex-row pt-20 md:pt-0">
            {themes.map((theme, idx) => (
              <div key={theme.id} onClick={() => { setCurrentTheme(theme); openBook(theme); }}
                className="flex-1 min-h-[33vh] md:min-h-screen flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out md:hover:flex-[1.5] group relative overflow-hidden"
                style={{backgroundColor: theme.id === 'medieval' ? '#78350f' : '#020617'}}>
                {/* Image d'arrière-plan avec effets */}
                <div className="absolute inset-0 transition-all duration-700">
                  <img 
                    key={theme.background_image || theme.backgroundImage || `theme-${theme.id}`}
                    src={theme.background_image || theme.backgroundImage}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    style={{
                      filter: 'blur(8px) brightness(0.4)',
                    }}
                    onError={(e) => {
                      e.target.style.opacity = '0';
                    }}
                  />
                  {/* Overlay qui s'éclaircit au survol */}
                  <div 
                    className="absolute inset-0 transition-all duration-700 group-hover:opacity-40"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.7))',
                    }}
                  />
                </div>

                {/* Style au survol : image beaucoup plus nette et plus claire */}
                <style>{`
                  .group:hover img {
                    filter: blur(2px) brightness(0.9) !important;
                  }
                `}</style>

                {/* Contenu */}
                <div className="relative z-10 text-center p-4 md:p-8 transform transition-all duration-500 group-hover:scale-110">
                  <h2 className={`text-3xl md:text-6xl font-bold mb-2 md:mb-4 drop-shadow-2xl transition-all duration-500 ${
                    theme.id === 'medieval' ? 'text-amber-300' : theme.id === 'lovecraft' ? 'text-emerald-400' : 'text-cyan-400'
                  }`} style={{
                    textShadow: '0 0 30px rgba(251, 191, 36, 0.5), 3px 3px 6px rgba(0,0,0,1)',
                    fontFamily: theme.id === 'medieval'
                      ? "'Cinzel', serif" :
                    theme.id === 'lovecraft'
                      ? "'IM Fell English', serif" :
                      "'Orbitron', sans-serif"
                  }}>
                    {theme.name}
                  </h2>
                  <p className={`text-base md:text-xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                    theme.id === 'medieval' ? 'text-amber-200' : theme.id === 'lovecraft' ? 'text-emerald-300' : 'text-cyan-300'
                  }`}>{t('home.clickToExplore')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGE PROPOSER - Formulaire de soumission REDESIGN */}
        {!showBook && currentPage === 'submit' && (
          <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-12">
                {/* Logo Feather */}
                <div className="flex justify-center mb-4 md:mb-6">
                  <img
                    src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Feather%20logo_wthback.png"
                    alt="Proposer"
                    className="w-16 h-16 md:w-24 md:h-24 object-contain"
                  />
                </div>
                <div className="inline-block bg-gradient-to-r from-amber-500 to-amber-700 text-transparent bg-clip-text mb-4">
                  <h1 className="text-3xl md:text-6xl font-bold">{t('submit.title')}</h1>
                </div>
                <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-700 mx-auto rounded-full mb-4 md:mb-6"></div>
                <p className="text-amber-300 text-base md:text-xl">{t('submit.subtitle')}</p>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-4 md:p-8 shadow-2xl">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  const pdfFile = e.target.pdfFile.files[0];
                  if (!pdfFile) {
                    alert(t('submit.noPdfError'));
                    return;
                  }

                  if (pdfFile.type !== 'application/pdf') {
                    alert(t('submit.pdfOnlyError'));
                    return;
                  }
                  
                  // Afficher un indicateur de chargement
                  const submitButton = e.target.querySelector('button[type="submit"]');
                  const originalButtonText = submitButton.innerHTML;
                  submitButton.disabled = true;
                  submitButton.innerHTML = `⏳ ${t('submit.sending')}`;
                  
                  try {
                    const submissionData = {
                      scenarioName: e.target.scenarioName.value,
                      author: e.target.author.value,
                      email: e.target.email.value,
                      summary: e.target.summary.value
                    };
                    
                    // Uploader vers Supabase (Storage + Database)
                    await supabaseService.createSubmission(submissionData, pdfFile);
                    
                    alert(t('submit.successMessage'));
                    e.target.reset();
                  } catch (error) {
                    console.error('Erreur soumission:', error);
                    alert(t('submit.errorMessage'));
                  } finally {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                  }
                }} className="space-y-6">
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">{t('submit.scenarioName')}</label>
                    <input
                      type="text"
                      name="scenarioName"
                      required
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder={t('submit.scenarioNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">{t('submit.author')}</label>
                    <input
                      type="text"
                      name="author"
                      required
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder={t('submit.authorPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">{t('submit.email')}</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder={t('submit.emailPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">{t('submit.summary')}</label>
                    <textarea
                      rows="5"
                      name="summary"
                      required
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder={t('submit.summaryPlaceholder')}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">{t('submit.pdfFile')}</label>
                    <div className="border-2 border-dashed border-amber-500/30 rounded-lg p-6 text-center bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <input 
                        type="file" 
                        name="pdfFile"
                        accept=".pdf,application/pdf" 
                        required 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.type !== 'application/pdf') {
                            alert(t('submit.pdfValidationError'));
                            e.target.value = '';
                          }
                        }}
                        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-700 file:text-white file:cursor-pointer file:hover:bg-amber-600 file:transition-colors"
                      />
                      <p className="text-xs text-amber-300 mt-2">📄 {t('submit.pdfFormatNote')}</p>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-lg hover:from-amber-500 hover:to-amber-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    ✨ {t('submit.submitButton')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* PAGE ADMIN - COMPLETE AVEC TOUS LES ONGLETS */}
        {!showBook && currentPage === 'admin' && (
          <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          }}>
            <div className="max-w-7xl mx-auto">
              {/* Logo Gear */}
              <div className="flex justify-center mb-4 md:mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <img
                    src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Gear%20logo_wthback.png"
                    alt="Administration"
                    className="relative w-16 h-16 md:w-28 md:h-28 object-contain transform group-hover:rotate-90 transition-transform duration-500"
                  />
                </div>
              </div>
              <h1 className="text-3xl md:text-6xl font-black mb-2 md:mb-4 text-center bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent tracking-tight">Administration</h1>
              <p className="text-center text-amber-400/80 text-sm md:text-lg mb-6 md:mb-10">Gérez votre bibliothèque de scénarios</p>

              <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6 md:mb-10">
                {[
                  {id: 'campagnes', icon: '📚', label: 'Campagnes', color: 'from-purple-600 to-purple-700'},
                  {id: 'scenarios', icon: '📖', label: 'Scénarios', color: 'from-blue-600 to-blue-700'},
                  {id: 'pageaccueil', icon: '🏠', label: 'Page Accueil', color: 'from-green-600 to-green-700'},
                  {id: 'apropos', icon: '📜', label: 'À propos', color: 'from-teal-600 to-teal-700'},
                  {id: 'notations', icon: '⭐', label: 'Notations', color: 'from-yellow-600 to-yellow-700'},
                  {id: 'soumissions', icon: '📥', label: 'Soumissions', color: 'from-pink-600 to-pink-700'},
                  {id: 'tags', icon: '🏷️', label: 'Tags', color: 'from-indigo-600 to-indigo-700'},
                  {id: 'parametres', icon: '⚙️', label: 'Paramètres', color: 'from-slate-600 to-slate-700'}
                ].map(tab => (
                  <button key={tab.id} onClick={() => setAdminTab(tab.id)}
                    className={`relative px-3 py-2 md:px-6 md:py-3.5 rounded-xl font-bold text-xs md:text-base transition-all transform hover:scale-105 overflow-hidden group ${
                      adminTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                    }`}>
                    {adminTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                    )}
                    <span className="relative flex items-center gap-1 md:gap-2">
                      <span className="text-base md:text-xl">{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/30 rounded-2xl p-4 md:p-8 shadow-2xl min-h-96 backdrop-blur-sm">
                
                {/* ONGLET CAMPAGNES */}
                {adminTab === 'campagnes' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-amber-900">📚 Gestion des Campagnes</h2>
                        <p className="text-amber-700 mt-2">Créez, modifiez ou supprimez des campagnes</p>
                      </div>
                      <button onClick={() => { setEditingSaga(null); setShowCampaignModal(true); }}
                        className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold flex items-center gap-2">
                        <Plus size={20} />Nouvelle
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {sagas.map(saga => {
                        const themeInfo = themes.find(t => t.id === saga.themeId);
                        const themeIcon = saga.themeId === 'medieval' ? '⚔️' : saga.themeId === 'lovecraft' ? '👁️' : '🚀';
                        const themeName = themeInfo ? themeInfo.name : 'Non défini';
                        
                        return (
                        <div key={saga.id} className="bg-amber-50 p-4 rounded-lg border-2 border-amber-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-amber-900">{saga.name}</h3>
                                <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs font-bold">
                                  {themeIcon} {themeName}
                                </span>
                                {saga.isFree ? (
                                  <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">📥 GRATUIT</span>
                                ) : (
                                  <span className="bg-amber-300 text-amber-900 px-3 py-1 rounded-full text-sm font-bold">💰 {saga.price.toFixed(2)} €</span>
                                )}
                              </div>
                              <p className="text-sm text-amber-700">{saga.description}</p>
                              <p className="text-sm text-amber-600 mt-2">📖 {saga.scenarios.length} scénario(s)</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingSaga(saga); setShowCampaignModal(true); }}
                                className="bg-amber-700 text-white px-4 py-2 rounded hover:bg-amber-600 flex items-center gap-2">
                                <Edit size={16} />Modifier
                              </button>
                              <button onClick={() => deleteCampaign(saga.id)}
                                className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2">
                                <Trash2 size={16} />Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* ONGLET SCENARIOS */}
                {adminTab === 'scenarios' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-amber-900">📖 Gestion des Scénarios</h2>
                        <p className="text-amber-700 mt-2">Sélectionnez une campagne puis gérez ses scénarios</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-amber-900 font-bold mb-2 text-lg">Sélectionner une campagne</label>
                      <select 
                        value={selectedSagaIdForScenarios || ''}
                        onChange={(e) => {
                          setSelectedSagaIdForScenarios(parseInt(e.target.value) || null);
                        }}
                        className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg bg-white text-lg">
                        <option value="">-- Choisir une campagne --</option>
                        {sagas.map(saga => (
                          <option key={saga.id} value={saga.id}>{saga.name} ({saga.scenarios.length} scénarios)</option>
                        ))}
                      </select>
                    </div>

                    {selectedSagaIdForScenarios ? (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-amber-900">
                            Scénarios de "{sagas.find(s => s.id === selectedSagaIdForScenarios)?.name}"
                          </h3>
                          <button 
                            onClick={() => { 
                              setEditingScenario(null); 
                              setShowScenarioModal(true); 
                            }}
                            className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-bold flex items-center gap-2">
                            <Plus size={20} />Nouveau scénario
                          </button>
                        </div>

                        {sagas.find(s => s.id === selectedSagaIdForScenarios)?.scenarios.length === 0 ? (
                          <div className="bg-amber-50 p-8 rounded-lg border-2 border-amber-700 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-xl text-amber-900 font-bold mb-2">Aucun scénario</p>
                            <p className="text-amber-700">Cliquez sur "Nouveau scénario" pour en ajouter un</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sagas.find(s => s.id === selectedSagaIdForScenarios)?.scenarios.map((scenario, index) => (
                              <div key={scenario.id} className="bg-amber-50 p-4 rounded-lg border-2 border-amber-700">
                                <div className="flex gap-4">
                                  {scenario.imageUrl && (
                                    <img 
                                      src={scenario.imageUrl} 
                                      alt={scenario.displayName}
                                      className="w-32 h-32 object-cover rounded border-2 border-amber-700"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="bg-amber-800 text-white px-2 py-1 rounded font-bold text-sm">
                                        #{scenario.position || (index + 1)}
                                      </span>
                                      <h4 className="font-bold text-xl text-amber-900">{scenario.displayName}</h4>
                                      {scenario.isFree ? (
                                        <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                          📥 GRATUIT
                                        </span>
                                      ) : (
                                        <span className="bg-amber-300 text-amber-900 px-3 py-1 rounded-full text-sm font-bold">
                                          💰 {scenario.price.toFixed(2)} €
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-amber-700 mb-2">{scenario.description}</p>
                                    <div className="flex gap-4 text-sm text-amber-600">
                                      <span>✍️ {scenario.author}</span>
                                      <span>⏱️ {scenario.duration}</span>
                                      <span>🏷️ {scenario.tags.join(', ')}</span>
                                    </div>
                                    <div className="flex gap-2 mt-3 text-xs">
                                      <span>🌙 {scenario.ratings.ambiance}/5</span>
                                      <span>🧩 {scenario.ratings.complexite}/5</span>
                                      <span>⚔️ {scenario.ratings.combat}/5</span>
                                      <span>🔍 {scenario.ratings.enquete}/5</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <button 
                                      onClick={() => { 
                                        setEditingScenario(scenario); 
                                        setShowScenarioModal(true); 
                                      }}
                                      className="bg-amber-700 text-white px-4 py-2 rounded hover:bg-amber-600 flex items-center gap-2">
                                      <Edit size={16} />Modifier
                                    </button>
                                    <button 
                                      onClick={() => deleteScenario(selectedSagaIdForScenarios, scenario.id)}
                                      className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2">
                                      <Trash2 size={16} />Supprimer
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-8 rounded-lg border-2 border-amber-700 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <p className="text-xl text-amber-900 font-bold mb-2">Sélectionnez une campagne</p>
                        <p className="text-amber-700">Choisissez une campagne dans le menu déroulant ci-dessus</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ONGLET PAGE ACCUEIL */}
                {adminTab === 'pageaccueil' && (
                  <PageAccueilTab themes={themes} setThemes={setThemes} refresh={refresh} />
                )}

                {/* ONGLET À PROPOS */}
                {adminTab === 'apropos' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-white">📜 Éditer la page "À propos"</h2>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      setSiteSettings({
                        ...siteSettings,
                        aboutContent: {
                          section1: formData.get('section1'),
                          section2: formData.get('section2'),
                          section3: formData.get('section3'),
                          contactEmail: formData.get('contactEmail')
                        }
                      });
                      alert('✅ Page "À propos" sauvegardée !');
                    }} className="space-y-6">
                      
                      <div className="bg-slate-800/50 border-2 border-teal-700/50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-teal-300 mb-4">Section 1 : Qui sommes-nous ?</h3>
                        <textarea
                          name="section1"
                          rows="5"
                          defaultValue={siteSettings.aboutContent?.section1 || "Nous sommes une équipe passionnée de maîtres du jeu et de créateurs de contenu dédiés à l'univers du jeu de rôle. Notre amour pour la narration collaborative et les aventures épiques nous pousse à partager nos créations avec la communauté rôliste francophone."}
                          className="w-full px-4 py-3 border-2 border-teal-700 rounded-lg bg-slate-700 text-teal-100 focus:outline-none focus:border-teal-500"
                          placeholder="Présentez qui vous êtes..."
                        />
                      </div>

                      <div className="bg-slate-800/50 border-2 border-teal-700/50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-teal-300 mb-4">Section 2 : Notre Objectif</h3>
                        <textarea
                          name="section2"
                          rows="5"
                          defaultValue={siteSettings.aboutContent?.section2 || "Cette bibliothèque a été conçue pour offrir des scénarios de jeu de rôle d'exception. Chaque scénario est soigneusement examiné, noté selon plusieurs critères (ambiance, complexité, combat, enquête), et validé par notre équipe avant publication. Nous privilégions la qualité à la quantité : seuls les meilleurs scénarios trouvent leur place dans notre collection."}
                          className="w-full px-4 py-3 border-2 border-teal-700 rounded-lg bg-slate-700 text-teal-100 focus:outline-none focus:border-teal-500"
                          placeholder="Décrivez votre objectif..."
                        />
                      </div>

                      <div className="bg-slate-800/50 border-2 border-teal-700/50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-teal-300 mb-4">Section 3 : L'Auteur</h3>
                        <textarea
                          name="section3"
                          rows="5"
                          defaultValue={siteSettings.aboutContent?.section3 || "Maître de jeu depuis plus de dix ans, j'ai exploré de nombreux univers et systèmes de jeu. Ma philosophie : créer des aventures mémorables qui laissent une empreinte durable dans l'esprit des joueurs."}
                          className="w-full px-4 py-3 border-2 border-teal-700 rounded-lg bg-slate-700 text-teal-100 focus:outline-none focus:border-teal-500"
                          placeholder="Parlez de vous..."
                        />
                      </div>

                      <div className="bg-slate-800/50 border-2 border-teal-700/50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-teal-300 mb-4">📧 Email de contact</h3>
                        <input
                          type="email"
                          name="contactEmail"
                          defaultValue={siteSettings.aboutContent?.contactEmail || "lecodexjdr@gmail.com"}
                          className="w-full px-4 py-3 border-2 border-teal-700 rounded-lg bg-slate-700 text-teal-100 focus:outline-none focus:border-teal-500"
                          placeholder="contact@exemple.com"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 rounded-lg hover:from-teal-500 hover:to-teal-600 font-bold text-lg shadow-lg">
                        💾 Sauvegarder la page "À propos"
                      </button>
                    </form>
                  </div>
                )}

                {/* ONGLET VISUEL */}
                {adminTab === 'visuel' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-amber-900">🎨 Configuration Visuelle</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-amber-900 font-bold mb-2 text-lg">Police des titres</label>
                        <select className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg bg-white text-lg">
                          <option>Serif (Classique)</option>
                          <option>Sans-serif (Moderne)</option>
                          <option>Monospace</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-amber-900 font-bold mb-2 text-lg">Thème par défaut</label>
                        <select className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg bg-white text-lg">
                          <option>Médiéval Fantasy</option>
                          <option>Horreur Lovecraftienne</option>
                          <option>Science-Fiction</option>
                        </select>
                      </div>
                    </div>
                    <button className="w-full mt-6 bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-bold text-lg">💾 Sauvegarder</button>
                  </div>
                )}

                {/* ONGLET NOTATIONS */}
                {adminTab === 'notations' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-amber-900">⭐ Configuration des Notations</h2>
                    <div className="grid grid-cols-2 gap-6">
                      {['ambiance', 'complexite', 'combat', 'enquete'].map(key => (
                        <div key={key} className="space-y-4">
                          <h3 className="font-bold text-xl text-amber-900 capitalize">{key}</h3>
                          <div>
                            <label className="block text-amber-900 font-bold mb-2">Icône</label>
                            <input type="text" defaultValue={adminConfig.ratingIcons[key]} className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg text-2xl text-center"/>
                          </div>
                          <div>
                            <label className="block text-amber-900 font-bold mb-2">Label</label>
                            <input type="text" defaultValue={adminConfig.ratingLabels[key]} className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg"/>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-6 bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-bold text-lg">💾 Sauvegarder</button>
                  </div>
                )}

                {/* ONGLET IMAGES */}
                {adminTab === 'images' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-amber-900">🖼️ Gestion des Images</h2>
                    <div className="border-2 border-dashed border-amber-700 rounded-lg p-8 text-center bg-amber-50 mb-6">
                      <div className="text-6xl mb-4">📤</div>
                      <p className="text-lg text-amber-900 mb-4">Glissez-déposez vos images ici</p>
                      <button className="bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-bold">Sélectionner</button>
                    </div>
                  </div>
                )}

                {/* ONGLET SOUMISSIONS */}
                {adminTab === 'soumissions' && (
                  <SubmissionsTab />
                )}

                {/* ONGLET TAGS */}
                {adminTab === 'tags' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-white">🏷️ Gestion des Tags</h2>
                      <p className="text-amber-300 mt-2">Visualisez et gérez les tags disponibles pour catégoriser vos scénarios</p>
                    </div>

                    {Object.keys(tags).length === 0 ? (
                      <div className="bg-slate-800/50 p-8 rounded-lg border-2 border-amber-700/50 text-center">
                        <div className="text-6xl mb-4">⏳</div>
                        <p className="text-xl text-white font-bold">Chargement des tags...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(tags).map(([category, categoryTags]) => (
                          <div key={category} className="bg-slate-800/50 border-2 border-amber-700/50 rounded-lg p-6">
                            <h3 className="text-2xl font-bold text-white mb-4 capitalize flex items-center gap-2">
                              {category === 'genre' && '🎭'}
                              {category === 'ambiance' && '🌙'}
                              {category === 'difficulte' && '📊'}
                              {category === 'duree' && '⏱️'}
                              {category === 'type' && '📖'}
                              {category === 'theme' && '🎨'}
                              {category}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                              {categoryTags.map((tag) => (
                                <span 
                                  key={tag.id}
                                  className="px-4 py-2 rounded-full font-semibold border-2 flex items-center gap-2 text-white"
                                  style={{ 
                                    backgroundColor: tag.color || '#f59e0b',
                                    borderColor: tag.color ? `${tag.color}80` : '#f59e0b80'
                                  }}
                                >
                                  {tag.icon && <span>{tag.icon}</span>}
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        <div className="bg-slate-800/50 border-2 border-cyan-700/50 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-cyan-300 mb-2">💡 Comment utiliser les tags</h3>
                          <ul className="list-disc list-inside text-cyan-100 space-y-1">
                            <li>Les tags sont automatiquement chargés depuis Supabase</li>
                            <li>Lors de la création/modification d'un scénario, vous pourrez sélectionner ces tags</li>
                            <li>Les tags permettent aux utilisateurs de filtrer et rechercher des scénarios</li>
                            <li>Pour ajouter de nouveaux tags, utilisez l'interface SQL Supabase ou consultez le guide</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ONGLET PARAMETRES */}
                {adminTab === 'parametres' && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6 text-amber-900">⚙️ Paramètres du Site</h2>
                    
                    <div className="bg-purple-50 border-2 border-purple-700 rounded-lg p-6 mb-6">
                      <h3 className="text-xl font-bold text-purple-900 mb-4">🔒 Sécurité - Mot de passe Admin</h3>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const currentPass = e.target.currentPassword.value;
                        const newPass = e.target.newPassword.value;
                        const confirmPass = e.target.confirmPassword.value;
                        
                        const adminPassword = localStorage.getItem('le-codex-admin-password') || 'admin123';
                        
                        if (currentPass !== adminPassword) {
                          alert('❌ Mot de passe actuel incorrect');
                          return;
                        }
                        
                        if (newPass.length < 6) {
                          alert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères');
                          return;
                        }
                        
                        if (newPass !== confirmPass) {
                          alert('❌ Les nouveaux mots de passe ne correspondent pas');
                          return;
                        }
                        
                        localStorage.setItem('le-codex-admin-password', newPass);
                        alert('✅ Mot de passe changé avec succès !');
                        e.target.reset();
                      }}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-purple-900 font-bold mb-2">Mot de passe actuel *</label>
                            <input 
                              type="password" 
                              name="currentPassword"
                              required
                              className="w-full px-4 py-3 border-2 border-purple-700 rounded-lg focus:outline-none focus:border-purple-900"
                              placeholder="Entrez votre mot de passe actuel"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-purple-900 font-bold mb-2">Nouveau mot de passe *</label>
                            <input 
                              type="password" 
                              name="newPassword"
                              required
                              minLength="6"
                              className="w-full px-4 py-3 border-2 border-purple-700 rounded-lg focus:outline-none focus:border-purple-900"
                              placeholder="Minimum 6 caractères"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-purple-900 font-bold mb-2">Confirmer le nouveau mot de passe *</label>
                            <input 
                              type="password" 
                              name="confirmPassword"
                              required
                              minLength="6"
                              className="w-full px-4 py-3 border-2 border-purple-700 rounded-lg focus:outline-none focus:border-purple-900"
                              placeholder="Retapez le nouveau mot de passe"
                            />
                          </div>
                          
                          <button 
                            type="submit"
                            className="w-full bg-purple-700 text-white px-6 py-3 rounded-lg hover:bg-purple-600 font-bold text-lg">
                            🔒 Changer le mot de passe
                          </button>
                        </div>
                      </form>
                      
                      <div className="mt-4 bg-purple-100 border border-purple-700 rounded-lg p-3">
                        <p className="text-sm text-purple-900">
                          <strong>💡 Note :</strong> Le mot de passe par défaut est "admin123". Changez-le dès maintenant pour sécuriser votre site.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border-2 border-blue-700 rounded-lg p-6 mb-6">
                      <h3 className="text-xl font-bold text-blue-900 mb-4">🏷️ Identité du Site</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-blue-900 font-bold mb-2 text-lg">Nom du site *</label>
                          <input 
                            type="text" 
                            value={siteSettings.siteName}
                            onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-blue-700 rounded-lg text-lg"
                            placeholder="Le Codex"
                          />
                          <p className="text-sm text-blue-700 mt-1">Apparaît dans la barre de navigation</p>
                        </div>

                        <div>
                          <label className="block text-blue-900 font-bold mb-2 text-lg">Slogan / Tagline</label>
                          <input 
                            type="text" 
                            value={siteSettings.tagline}
                            onChange={(e) => setSiteSettings({...siteSettings, tagline: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-blue-700 rounded-lg text-lg"
                            placeholder="Bibliothèque de scénarios JDR"
                          />
                          <p className="text-sm text-blue-700 mt-1">Petit texte sous le nom du site (optionnel)</p>
                        </div>

                        <div>
                          <label className="block text-blue-900 font-bold mb-2 text-lg">Logo du site (URL)</label>
                          <input 
                            type="text" 
                            value={siteSettings.logoUrl}
                            onChange={(e) => setSiteSettings({...siteSettings, logoUrl: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-blue-700 rounded-lg text-lg"
                            placeholder="https://i.imgur.com/XXXXX.png"
                          />
                          <p className="text-sm text-blue-700 mt-2">
                            💡 Recommandé : Image carrée (200x200px minimum). Uploadez sur <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Imgur.com</a>
                          </p>
                          
                          {siteSettings.logoUrl && (
                            <div className="mt-4 bg-white p-4 rounded-lg border-2 border-blue-700">
                              <p className="text-sm font-bold text-blue-900 mb-2">Aperçu :</p>
                              <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-lg">
                                <img 
                                  src={siteSettings.logoUrl} 
                                  alt="Logo preview"
                                  className="h-12 w-12 object-contain rounded-lg border-2 border-amber-700 bg-amber-950/50 p-1"
                                  onError={(e) => { e.target.style.border = '2px solid red'; }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-2xl font-bold text-amber-300">{siteSettings.siteName}</span>
                                  {siteSettings.tagline && (
                                    <span className="text-xs text-amber-500">{siteSettings.tagline}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-amber-900 font-bold mb-2 text-lg">Email de contact</label>
                        <input type="email" defaultValue="lecodexjdr@gmail.com" className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg text-lg"/>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="w-6 h-6" defaultChecked/>
                          <span className="text-lg">Activer les soumissions</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="w-6 h-6" defaultChecked/>
                          <span className="text-lg">Afficher les statistiques</span>
                        </label>
                      </div>
                    </div>
                    <button className="w-full mt-6 bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-bold text-lg">💾 Sauvegarder</button>
                    
                    <div className="bg-red-50 border-2 border-red-700 rounded-lg p-6 mt-8">
                      <h3 className="text-2xl font-bold text-red-900 mb-3">⚠️ Zone Dangereuse</h3>
                      <p className="text-red-800 mb-4">
                        Si vous rencontrez des problèmes avec les campagnes (mauvais thème, doublons, etc.), 
                        utilisez ce bouton pour réinitialiser toutes les données.
                      </p>
                      <button 
                        onClick={resetData}
                        className="w-full bg-red-700 text-white px-6 py-4 rounded-lg hover:bg-red-600 font-bold text-lg flex items-center justify-center gap-2">
                        🔄 Réinitialiser toutes les données
                      </button>
                      <p className="text-xs text-red-700 mt-2 text-center">
                        ⚠️ Cette action restaurera les données d'origine et supprimera toutes vos modifications
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGE STATS - AVEC VRAIES DONNEES */}
        {!showBook && currentPage === 'stats' && (
          <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8">
            <div className="max-w-7xl mx-auto">
              {/* Logo Book */}
              <div className="flex justify-center mb-4 md:mb-6">
                <img
                  src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Book%20logo_wthback.png"
                  alt="Statistiques"
                  className="w-16 h-16 md:w-24 md:h-24 object-contain"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-8 text-amber-300 text-center">Statistiques</h1>
              <div className="bg-amber-100 border-2 md:border-4 border-amber-900 rounded-2xl p-4 md:p-8 shadow-2xl">
                <StatsDisplay />
              </div>
            </div>
          </div>
        )}

        {/* PAGE À PROPOS - REDESIGN MODERNE */}
        {!showBook && currentPage === 'about' && (
          <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8 md:mb-16">
                <div className="inline-block bg-gradient-to-r from-amber-500 to-amber-700 text-transparent bg-clip-text mb-4">
                  <h1 className="text-4xl md:text-7xl font-bold">{t('about.title')}</h1>
                </div>
                <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-700 mx-auto rounded-full"></div>
              </div>

              <div className="space-y-6 md:space-y-10">
                <section className="text-center bg-slate-800/50 backdrop-blur-sm border-2 border-amber-700/30 rounded-2xl p-4 md:p-8 shadow-xl">
                  <div className="flex justify-center mb-4">
                    <img src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Logo%20group_wthback.png" alt={t('about.whoWeAre')} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-amber-300">{t('about.whoWeAre')}</h2>
                  <p className="text-base md:text-lg leading-relaxed text-amber-100/90">
                    {siteSettings.aboutContent?.section1 || t('about.whoWeAreDefault')}
                  </p>
                </section>

                <section className="text-center bg-slate-800/50 backdrop-blur-sm border-2 border-amber-700/30 rounded-2xl p-4 md:p-8 shadow-xl">
                  <div className="flex justify-center mb-4">
                    <img src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Logo%20target_wthback.png" alt={t('about.ourGoal')} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-amber-300">{t('about.ourGoal')}</h2>
                  <p className="text-base md:text-lg leading-relaxed text-amber-100/90">
                    {siteSettings.aboutContent?.section2 || t('about.ourGoalDefault')}
                  </p>
                </section>

                <section className="text-center bg-slate-800/50 backdrop-blur-sm border-2 border-amber-700/30 rounded-2xl p-4 md:p-8 shadow-xl">
                  <div className="flex justify-center mb-4">
                    <img src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Feather%20logo_wthback.png" alt={t('about.theAuthor')} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-amber-300">{t('about.theAuthor')}</h2>
                  <p className="text-base md:text-lg leading-relaxed text-amber-100/90">
                    {siteSettings.aboutContent?.section3 || t('about.theAuthorDefault')}
                  </p>
                </section>

                <section className="text-center bg-slate-800/50 backdrop-blur-sm border-2 border-amber-700/30 rounded-2xl p-8 shadow-xl">
                  <div className="flex justify-center mb-4">
                    <img src="https://csgndyapcoymkynbvckg.supabase.co/storage/v1/object/public/images/logos/Gear%20logo_wthback.png" alt={t('about.howItWorks')} className="w-24 h-24 object-contain" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-amber-300">{t('about.howItWorks')}</h2>
                  <div className="space-y-3 text-left max-w-2xl mx-auto">
                    <p className="flex items-start gap-3 text-amber-100/90">
                      <span className="text-amber-400 font-bold text-xl">1.</span>
                      <span><strong className="text-amber-300">{t('about.step1Title')}</strong> - {t('about.step1Desc')}</span>
                    </p>
                    <p className="flex items-start gap-3 text-amber-100/90">
                      <span className="text-amber-400 font-bold text-xl">2.</span>
                      <span><strong className="text-amber-300">{t('about.step2Title')}</strong> - {t('about.step2Desc')}</span>
                    </p>
                    <p className="flex items-start gap-3 text-amber-100/90">
                      <span className="text-amber-400 font-bold text-xl">3.</span>
                      <span><strong className="text-amber-300">{t('about.step3Title')}</strong> - {t('about.step3Desc')}</span>
                    </p>
                    <p className="flex items-start gap-3 text-amber-100/90">
                      <span className="text-amber-400 font-bold text-xl">4.</span>
                      <span><strong className="text-amber-300">{t('about.step4Title')}</strong> - {t('about.step4Desc')}</span>
                    </p>
                  </div>
                </section>

                <section className="text-center border-t-2 border-amber-700/50 pt-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                  <div className="text-5xl mb-4">📧</div>
                  <h2 className="text-2xl font-bold mb-3 text-amber-300">{t('about.contact')}</h2>
                  <p className="text-xl font-semibold text-amber-200">
                    {siteSettings.aboutContent?.contactEmail || "lecodexjdr@gmail.com"}
                  </p>
                </section>

                <section className="text-center pt-6">
                  <p className="text-sm text-amber-400/80">© 2025 Le Codex - Tous droits réservés</p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* PAGE SCENARIOS */}
        {showBook && (
          <div className="min-h-screen relative overflow-hidden bg-slate-950">
            {/* Image/Vidéo de fond de la campagne - Visible et esthétique */}
            {selectedSaga && (selectedSaga.backgroundImageUrl || selectedSaga.background_image_url || selectedSaga.backgroundVideoUrl || selectedSaga.background_video_url) ? (
              <div className="fixed inset-0 z-0">
                {/* Si une vidéo est définie, l'utiliser */}
                {(selectedSaga.backgroundVideoUrl || selectedSaga.background_video_url) ? (
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ filter: 'blur(2px) brightness(0.4)' }}
                  >
                    <source src={selectedSaga.backgroundVideoUrl || selectedSaga.background_video_url} type="video/mp4" />
                  </video>
                ) : (
                  /* Sinon afficher l'image */
                  <img 
                    src={selectedSaga.backgroundImageUrl || selectedSaga.background_image_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                    style={{ filter: 'blur(3px) brightness(0.5)' }}
                    onError={(e) => {
                      console.error('Erreur chargement image campagne:', selectedSaga);
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                {/* Overlay gradient pour lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/70"></div>
              </div>
            ) : (
              /* Fallback : gradient selon le thème si pas d'image */
              <div className={`fixed inset-0 z-0 ${
                currentTheme.id === 'medieval' ? 'bg-gradient-to-b from-amber-950 via-amber-900 to-stone-900' :
                currentTheme.id === 'lovecraft' ? 'bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950' :
                'bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950'
              }`}></div>
            )}

            {/* Bouton retour flottant selon le thème */}
            <button
              onClick={closeBook}
              className={`fixed top-36 md:top-24 left-2 md:left-20 z-50 backdrop-blur-md p-2 md:px-6 md:py-3 rounded-full flex items-center gap-2 transition-all shadow-2xl hover:scale-105 border-2 ${
                currentTheme.id === 'medieval'
                  ? 'bg-amber-800/90 hover:bg-amber-700 text-amber-100 border-amber-600 hover:border-amber-400' :
                currentTheme.id === 'lovecraft'
                  ? 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border-emerald-600 hover:border-emerald-400' :
                  'bg-cyan-900/90 hover:bg-cyan-800 text-cyan-100 border-cyan-600 hover:border-cyan-400'
              }`}>
              <ChevronLeft size={20} />
              <span className="font-bold hidden md:inline">{t('scenarios.back')}</span>
            </button>

            {/* Bannière distincte avec fond propre + Motifs thématiques */}
            <div className="relative z-20 mb-4 md:mb-8 pt-2 md:pt-4">
              <div className={`mx-2 md:mx-6 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 md:border-4 ${
                currentTheme.id === 'medieval' 
                  ? 'bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 border-amber-700' :
                currentTheme.id === 'lovecraft'
                  ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-700' :
                  'bg-gradient-to-br from-cyan-950 via-cyan-900 to-cyan-950 border-cyan-700'
              }`}>
                <div className="pt-4 pb-4 md:pt-8 md:pb-8 text-center relative overflow-hidden">
                  {/* Logo du site en haut à droite - caché sur mobile */}
                  <div className="absolute top-4 right-6 z-20 hidden md:block">
                    {siteSettings.logoUrl ? (
                      <img 
                        src={siteSettings.logoUrl}
                        alt="Logo"
                        className={`h-48 w-48 object-contain rounded-lg border-3 p-1 ${
                          currentTheme.id === 'medieval' 
                            ? 'border-amber-600 bg-amber-950/50' :
                          currentTheme.id === 'lovecraft'
                            ? 'border-emerald-600 bg-emerald-950/50' :
                            'border-cyan-600 bg-cyan-950/50'
                        }`}
                      />
                    ) : (
                      <div className={`text-8xl p-2 rounded-lg border-3 ${
                        currentTheme.id === 'medieval' 
                          ? 'border-amber-600 bg-amber-950/50' :
                        currentTheme.id === 'lovecraft'
                          ? 'border-emerald-600 bg-emerald-950/50' :
                          'border-cyan-600 bg-cyan-950/50'
                      }`}>📚</div>
                    )}
                  </div>
                  {/* Motifs d'arrière-plan selon le thème */}
                  <div className="absolute inset-0 pointer-events-none opacity-15" style={{
                    backgroundImage: currentTheme.id === 'medieval' 
                      ? `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(217, 119, 6, 0.3) 35px, rgba(217, 119, 6, 0.3) 70px),
                         repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(217, 119, 6, 0.3) 35px, rgba(217, 119, 6, 0.3) 70px)`
                      : currentTheme.id === 'lovecraft'
                      ? `radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.4) 0%, transparent 50%),
                         radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                         repeating-radial-gradient(circle at 50% 50%, transparent 0, rgba(16, 185, 129, 0.15) 10px, transparent 20px)`
                      : `linear-gradient(90deg, transparent 49%, rgba(6, 182, 212, 0.4) 49%, rgba(6, 182, 212, 0.4) 51%, transparent 51%),
                         linear-gradient(0deg, transparent 49%, rgba(6, 182, 212, 0.4) 49%, rgba(6, 182, 212, 0.4) 51%, transparent 51%)`,
                    backgroundSize: currentTheme.id === 'medieval' ? '70px 70px' :
                      currentTheme.id === 'lovecraft' ? '200px 200px' : '50px 50px'
                  }}></div>
                  
                  <h1 className={`text-2xl md:text-6xl font-bold mb-2 md:mb-3 drop-shadow-2xl relative z-10 ${
                    currentTheme.id === 'medieval'
                      ? 'text-amber-300' :
                    currentTheme.id === 'lovecraft'
                      ? 'text-emerald-300' :
                      'text-cyan-300'
                  }`} style={{
                    fontFamily: currentTheme.id === 'medieval' 
                      ? "'Cinzel', serif" :
                    currentTheme.id === 'lovecraft'
                      ? "'IM Fell English', serif" :
                      "'Orbitron', sans-serif",
                    textShadow: currentTheme.id === 'medieval' 
                      ? '0 0 40px rgba(251, 191, 36, 0.6), 4px 4px 8px rgba(0,0,0,0.8)' :
                    currentTheme.id === 'lovecraft'
                      ? '0 0 40px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)' :
                      '0 0 40px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.5)'
                  }}>
                    {currentTheme.id === 'medieval' && '⚔️ '}
                    {currentTheme.id === 'lovecraft' && '👁️ '}
                    {currentTheme.id === 'scifi' && '🚀 '}
                    {currentTheme.name}
                  </h1>
                  <p className={`text-sm md:text-xl relative z-10 mb-2 md:mb-4 ${
                    currentTheme.id === 'medieval' ? 'text-amber-400 font-serif italic' :
                    currentTheme.id === 'lovecraft' ? 'text-emerald-400 font-mono' :
                    'text-cyan-400 tracking-wide'
                  }`}>
                    {currentTheme.id === 'medieval' && t('scenarios.medievalSubtitle')}
                    {currentTheme.id === 'lovecraft' && t('scenarios.lovecraftSubtitle')}
                    {currentTheme.id === 'scifi' && t('scenarios.scifiSubtitle')}
                  </p>
                  
                  {/* Champ de recherche par tags */}
                  <div className="max-w-xs md:max-w-md mx-auto relative z-10 px-2 md:px-0">
                    <input
                      type="text"
                      value={searchTag}
                      onChange={(e) => setSearchTag(e.target.value)}
                      placeholder={t('scenarios.searchPlaceholder')}
                      className={`w-full px-4 py-2 md:px-6 md:py-3 rounded-full text-center text-sm md:text-base font-semibold transition-all focus:outline-none focus:ring-4 ${
                        currentTheme.id === 'medieval'
                          ? 'bg-amber-900/80 text-amber-100 placeholder-amber-400/70 focus:ring-amber-500/50 border-2 border-amber-600'
                          : currentTheme.id === 'lovecraft'
                          ? 'bg-emerald-900/80 text-emerald-100 placeholder-emerald-400/70 focus:ring-emerald-500/50 border-2 border-emerald-600'
                          : 'bg-cyan-900/80 text-cyan-100 placeholder-cyan-400/70 focus:ring-cyan-500/50 border-2 border-cyan-600'
                      }`}
                    />
                    {searchTag && (
                      <button
                        onClick={() => setSearchTag('')}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                          currentTheme.id === 'medieval'
                            ? 'hover:bg-amber-700 text-amber-300'
                            : currentTheme.id === 'lovecraft'
                            ? 'hover:bg-emerald-700 text-emerald-300'
                            : 'hover:bg-cyan-700 text-cyan-300'
                        }`}
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu horizontal des campagnes - Caché sur mobile (doublon avec carte campagne) */}
            <div className="hidden md:block sticky top-0 z-40 py-6 mb-8">
              {(() => {
                const themeCampaigns = sagas.filter(s => {
                  const sagaThemeId = String(s.themeId || '').trim().toLowerCase();
                  const currentThemeId = String(currentTheme.id || '').trim().toLowerCase();
                  return sagaThemeId === currentThemeId;
                });
                
                if (themeCampaigns.length > 0) {
                  return (
                    <div className="overflow-x-auto scrollbar-hide px-4">
                      <div className="flex gap-4 pb-4 min-w-max justify-center mx-auto" style={{maxWidth: 'fit-content'}}>
                        {themeCampaigns.map((saga) => {
                          const globalIndex = sagas.findIndex(s => s.id === saga.id);
                          const isActive = currentSagaIndex === globalIndex;
                          return (
                            <button 
                              key={saga.id}
                              onClick={() => { setCurrentSagaIndex(globalIndex); setCurrentScenario(0); }}
                              className={`px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 whitespace-nowrap relative overflow-hidden border-2 ${
                                currentTheme.id === 'medieval' 
                                  ? isActive 
                                    ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 shadow-2xl shadow-amber-900/60 border-amber-500' 
                                    : 'bg-amber-950/50 backdrop-blur-sm text-amber-300 hover:bg-amber-900/70 border-amber-800/50'
                                  : currentTheme.id === 'lovecraft'
                                  ? isActive
                                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-emerald-50 shadow-2xl shadow-emerald-900/60 border-emerald-500'
                                    : 'bg-emerald-950/50 backdrop-blur-sm text-emerald-300 hover:bg-emerald-900/70 border-emerald-800/50'
                                  : isActive
                                    ? 'bg-gradient-to-r from-cyan-800 to-cyan-700 text-cyan-50 shadow-2xl shadow-cyan-900/60 border-cyan-500'
                                    : 'bg-cyan-950/50 backdrop-blur-sm text-cyan-300 hover:bg-cyan-900/70 border-cyan-800/50'
                              }`}>
                              {isActive && (
                                <div className={`absolute inset-0 bg-gradient-to-r to-transparent animate-pulse ${
                                  currentTheme.id === 'medieval' ? 'from-amber-500/20' :
                                  currentTheme.id === 'lovecraft' ? 'from-emerald-500/20' :
                                  'from-cyan-500/20'
                                }`}></div>
                              )}
                              <div className="flex items-center gap-3 relative z-10">
                                <span className="text-lg" style={{
                                  fontFamily: currentTheme.id === 'medieval' 
                                    ? "'Cinzel', serif" :
                                  currentTheme.id === 'lovecraft'
                                    ? "'IM Fell English', serif" :
                                  currentTheme.id === 'scifi'
                                    ? "'Orbitron', sans-serif" :
                                    "'Crimson Text', serif"
                                }}>{saga.name}</span>
                                {saga.isFree && (
                                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs font-bold border border-green-500/50">
                                    📥
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="px-6 pb-12 relative z-10">
              {selectedSaga ? null : (
                  <div className="text-center py-20">
                    <h2 className="text-4xl font-bold text-amber-300 mb-4">{currentTheme.name}</h2>
                    <div className="max-w-2xl mx-auto bg-amber-100 border-4 border-amber-900 rounded-lg p-12 shadow-2xl">
                      <div className="text-8xl mb-6">📚</div>
                      <h3 className="text-3xl font-bold text-amber-900 mb-4">{t('scenarios.noCampaigns')}</h3>
                      <p className="text-xl text-amber-700" style={{ whiteSpace: 'pre-line' }}>
                        {t('scenarios.noCampaignsMessage')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal de détail du scénario */}
              {viewingScenario && (
                <ScenarioDetailModal 
                  scenario={viewingScenario}
                  saga={selectedSaga}
                  onClose={() => setViewingScenario(null)}
                  onDownloadFree={handleDownloadFree}
                  onAddToCart={addToCart}
                />
              )}

              {/* Carousel de scénarios */}
              {(() => {
                // Si une recherche est active, afficher tous les scénarios filtrés du thème
                if (searchTag && searchTag.trim() !== '') {
                  const allThemeScenarios = getAllScenariosForTheme(currentTheme.id);
                  const filteredScenarios = filterScenariosByTag(allThemeScenarios, searchTag);
                  
                  if (filteredScenarios.length === 0) {
                    return (
                      <div className="max-w-4xl mx-auto text-center py-12">
                        <div className={`text-8xl mb-6 ${
                          currentTheme.id === 'medieval' ? 'text-amber-400' :
                          currentTheme.id === 'lovecraft' ? 'text-emerald-400' :
                          'text-cyan-400'
                        }`}>🔍</div>
                        <h3 className={`text-3xl font-bold mb-4 ${
                          currentTheme.id === 'medieval' ? 'text-amber-300' :
                          currentTheme.id === 'lovecraft' ? 'text-emerald-300' :
                          'text-cyan-300'
                        }`}>
                          {t('scenarios.noResults')} "{searchTag}"
                        </h3>
                        <p className={`text-xl ${
                          currentTheme.id === 'medieval' ? 'text-amber-400/80' :
                          currentTheme.id === 'lovecraft' ? 'text-emerald-400/80' :
                          'text-cyan-400/80'
                        }`}>
                          {t('scenarios.noResultsHint')}
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <div className="max-w-4xl mx-auto mb-6 text-center">
                        <p className={`text-xl font-bold ${
                          currentTheme.id === 'medieval' ? 'text-amber-300' :
                          currentTheme.id === 'lovecraft' ? 'text-emerald-300' :
                          'text-cyan-300'
                        }`}>
                          🔍 {filteredScenarios.length} {t('scenarios.searchResults')} "{searchTag}"
                        </p>
                      </div>
                      <ScenarioCarousel 
                        scenarios={filteredScenarios}
                        saga={selectedSaga || { name: currentTheme.name }}
                        onDownloadFree={handleDownloadFree}
                        onAddToCart={addToCart}
                        onScenarioClick={setViewingScenario}
                        theme={currentTheme}
                      />
                    </>
                  );
                }
                
                // Sinon, afficher les scénarios de la campagne sélectionnée
                if (selectedSaga && selectedSaga.scenarios && selectedSaga.scenarios.length > 0) {
                  return (
                    <ScenarioCarousel 
                      scenarios={selectedSaga.scenarios}
                      saga={selectedSaga}
                      onDownloadFree={handleDownloadFree}
                      onAddToCart={addToCart}
                      onScenarioClick={setViewingScenario}
                      theme={currentTheme}
                    />
                  );
                }
                
                return null;
              })()}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/test-supabase" element={<TestSupabase />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <LanguageProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </LanguageProvider>
  );
} else {
  console.error('Element #root introuvable');
}

// ============================================================================
// COMPOSANT UPLOAD D'IMAGES - À ajouter dans le fichier
// ============================================================================

const ImageUploadField = ({ value, onChange, label }) => {
  const [preview, setPreview] = useState(value || '');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Créer une URL de prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      setPreview(imageUrl);
      onChange(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = (url) => {
    setPreview(url);
    onChange(url);
  };

  const clearImage = () => {
    setPreview('');
    onChange('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-amber-900 font-bold">{label}</label>

      {!preview ? (
        <div className="space-y-4">
          {/* Option 1 : Upload fichier */}
          <div className="border-2 border-dashed border-amber-700 rounded-lg p-6 text-center bg-amber-50">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-amber-900 mb-3">Option 1 : Sélectionner un fichier</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id={`imageUpload-${label}`}
            />
            <label
              htmlFor={`imageUpload-${label}`}
              className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-700 cursor-pointer inline-block"
            >
              Choisir une image
            </label>
            <p className="text-xs text-amber-700 mt-2">JPG, PNG, GIF, WEBP</p>
          </div>

          {/* Option 2 : URL Imgur */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-amber-800 hover:text-amber-900 font-semibold underline"
            >
              {showUrlInput ? '▼' : '►'} Option 2 : Utiliser une URL (Imgur recommandé)
            </button>
          </div>

          {showUrlInput && (
            <div className="bg-blue-50 border-2 border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-3">
                💡 <strong>Recommandé :</strong> Uploadez votre image sur{' '}
                <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                  Imgur.com
                </a>
                {' '}puis collez l'URL ici
              </p>
              <input
                type="text"
                placeholder="https://i.imgur.com/XXXXX.jpg"
                onChange={(e) => handleUrlInput(e.target.value)}
                className="w-full px-4 py-2 border-2 border-blue-700 rounded focus:outline-none focus:border-blue-900"
              />
              <p className="text-xs text-blue-700 mt-2">
                Ou utilisez : /images/scenarios/mon-image.jpg (pour les images locales)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border-4 border-amber-800"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg"
          >
            <X size={20} />
          </button>
          <div className="mt-2 bg-amber-50 p-2 rounded border border-amber-700">
            <p className="text-xs text-amber-800 break-all">
              <strong>URL :</strong> {preview.substring(0, 80)}{preview.length > 80 ? '...' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={clearImage}
            className="mt-2 text-sm text-amber-700 hover:text-amber-900 underline"
          >
            Changer l'image
          </button>
        </div>
      )}
    </div>
  );
};
