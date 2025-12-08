// ============================================================================
// LE CODEX - APPLICATION COMPLÈTE
// Toutes les pages Admin, Stats, À propos + Gestion Gratuit/Payant
// ============================================================================

import './index.css';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Download, Star, Clock, ChevronLeft, ChevronRight, ShoppingCart, Trash2, CreditCard, Check, Edit, Plus, X, Lock } from 'lucide-react';
import TestSupabase from './pages/TestSupabase';
import { useSupabaseData } from './hooks/useSupabaseData';
import { supabaseService } from './services/supabaseService';

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
    backgroundImage: "https://i.imgur.com/VQM3KJm.jpeg",
    colors: {
      bg: "bg-slate-900", primary: "bg-emerald-900", text: "text-emerald-100",
      textLight: "text-emerald-300", card: "bg-slate-800", hover: "hover:bg-emerald-800",
      starFilled: "text-emerald-400", starEmpty: "text-slate-600", tag: "bg-emerald-900 text-emerald-300"
    }
  },
  {
    id: "lovecraft",
    name: "Horreur Lovecraftienne",
    backgroundImage: "https://i.imgur.com/8yZqQJ7.jpeg",
    colors: {
      bg: "bg-amber-50", primary: "bg-amber-800", text: "text-amber-900",
      textLight: "text-amber-700", card: "bg-amber-100", hover: "hover:bg-amber-700",
      starFilled: "text-yellow-600", starEmpty: "text-gray-400", tag: "bg-amber-200 text-amber-800"
    }
  },
  {
    id: "scifi",
    name: "Science-Fiction",
    backgroundImage: "https://i.imgur.com/m3rWsXP.jpeg",
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
            <StarRating rating={scenario.ratings.ambiance} label={adminConfig.ratingLabels.ambiance} icon={adminConfig.ratingIcons.ambiance} theme={colors} />
            <StarRating rating={scenario.ratings.complexite} label={adminConfig.ratingLabels.complexite} icon={adminConfig.ratingIcons.complexite} theme={colors} />
          </div>
          <div>
            <StarRating rating={scenario.ratings.combat} label={adminConfig.ratingLabels.combat} icon={adminConfig.ratingIcons.combat} theme={colors} />
            <StarRating rating={scenario.ratings.enquete} label={adminConfig.ratingLabels.enquete} icon={adminConfig.ratingIcons.enquete} theme={colors} />
          </div>
        </div>
        {hasPreviousCampaign && (
          <button onClick={onPreviousCampaign} className="mt-auto bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2">
            <ChevronLeft size={20} />Campagne précédente
          </button>
        )}
      </div>
    );
  } else {
    return (
      <div className="w-full h-full p-8 pl-4 flex flex-col">
        <div className="mb-6 flex-grow">
          <h3 className={`text-lg font-bold mb-3 ${colors.text}`}>Résumé</h3>
          <p className={`text-base ${colors.textLight} leading-relaxed`}>{scenario.description}</p>
        </div>
        <div className="mb-4">
          <h3 className={`text-sm font-bold mb-1 ${colors.text}`}>Auteur</h3>
          <p className={`text-base ${colors.textLight}`}>{scenario.author}</p>
        </div>
        <div className="mb-6">
          <h3 className={`text-sm font-bold mb-2 ${colors.text}`}>Tags</h3>
          <div className="flex flex-wrap gap-2">
            {scenario.tags.map((tag, i) => <span key={i} className={`${colors.tag} px-3 py-1 rounded-full text-sm`}>{tag}</span>)}
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          {scenario.isFree ? (
            <div className="bg-green-100 border-2 border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-green-900">📥 Scénario individuel</span>
                <span className="text-2xl font-bold text-green-800">GRATUIT</span>
              </div>
              <button 
                onClick={() => onDownloadFree(scenario.pdfUrl, scenario.displayName)}
                className="w-full bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2 font-semibold">
                <Download size={18} />Télécharger PDF
              </button>
            </div>
          ) : (
            <div className="bg-amber-200 border-2 border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-amber-900">🛒 Scénario individuel</span>
                <span className="text-2xl font-bold text-amber-800">{scenario.price.toFixed(2)} €</span>
              </div>
              <button 
                onClick={() => onAddToCart({ type: 'scenario', item: scenario, saga })}
                className={`w-full ${colors.primary} text-white px-4 py-2 rounded ${colors.hover} flex items-center justify-center gap-2 font-semibold`}>
                <ShoppingCart size={18} />Ajouter au panier
              </button>
            </div>
          )}
          
          {saga.isFree ? (
            <div className="bg-green-100 border-2 border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-green-900">📥 Campagne complète</span>
                <span className="text-2xl font-bold text-green-800">GRATUIT</span>
              </div>
              <p className="text-xs text-green-700 mb-2">{saga.scenarios.length} scénarios inclus</p>
              <button 
                onClick={() => onDownloadFree(saga.pdfUrl, saga.name)}
                className="w-full bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2 font-semibold">
                <Download size={18} />Télécharger PDF
              </button>
            </div>
          ) : (
            <div className="bg-amber-200 border-2 border-amber-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-amber-900">🛒 Campagne complète</span>
                <span className="text-2xl font-bold text-amber-800">{saga.price.toFixed(2)} €</span>
              </div>
              <p className="text-xs text-amber-700 mb-2">Économisez {((saga.scenarios.filter(s => !s.isFree).reduce((sum, s) => sum + s.price, 0) - saga.price).toFixed(2))} €</p>
              <button 
                onClick={() => onAddToCart({ type: 'saga', item: saga })}
                className={`w-full ${colors.primary} text-white px-4 py-2 rounded ${colors.hover} flex items-center justify-center gap-2 font-semibold`}>
                <ShoppingCart size={18} />Ajouter au panier
              </button>
            </div>
          )}
        </div>
        
        {hasNextCampaign && (
          <button onClick={onNextCampaign} className="mt-auto bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2 ml-auto">
            Campagne suivante<ChevronRight size={20} />
          </button>
        )}
      </div>
    );
  }
};

const CampaignEditModal = ({ saga, onSave, onClose, themes }) => {
  const [editedSaga, setEditedSaga] = useState(saga || {
    id: Date.now(),
    name: '',
    themeId: 'medieval',
    description: '',
    price: 24.99,
    isFree: false,
    pdfUrl: '',
    backgroundImageUrl: '',
    scenarios: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedSaga);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-amber-900">
            {saga ? '✏️ Modifier' : '➕ Créer'} une campagne
          </h2>
          <button onClick={onClose} className="text-amber-900 hover:text-amber-700 text-2xl">
            <X size={28} />
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
  if (!scenario) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="fixed top-4 right-4 bg-amber-800 text-white p-3 rounded-full hover:bg-amber-700 shadow-2xl z-50">
          <X size={32} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche - Image en grand */}
          <div className="flex items-center justify-center bg-black/50 rounded-lg p-4">
            <img 
              src={scenario.imageUrl} 
              alt={scenario.displayName}
              className="w-full max-h-[85vh] object-contain rounded-lg border-4 border-amber-800 shadow-2xl"
            />
          </div>

          {/* Colonne droite - Détails */}
          <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-8 shadow-2xl">
            <h2 className="text-4xl font-bold text-amber-900 mb-4 font-serif">{scenario.displayName}</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-amber-900 mb-2">Description</h3>
              <p className="text-amber-800 leading-relaxed">{scenario.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-amber-900 mb-1">Auteur</h3>
              <p className="text-amber-800">{scenario.author}</p>
            </div>

            <div className="flex items-center gap-2 mb-4 text-amber-800">
              <Clock size={18} />
              <span className="font-semibold">{scenario.duration}</span>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-amber-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {scenario.tags.map((tag, i) => (
                  <span key={i} className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-amber-900 mb-3">Notations</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌙</span>
                  <span className="text-xs font-medium w-20 text-amber-700">Ambiance</span>
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
                  <span className="text-xs font-medium w-20 text-amber-700">Complexité</span>
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
                  <span className="text-xs font-medium w-20 text-amber-700">Combat</span>
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
                  <span className="text-xs font-medium w-20 text-amber-700">Enquête</span>
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
                <Download size={24} />Télécharger PDF
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-amber-900">Prix du scénario</span>
                    <span className="text-3xl font-bold text-amber-800">{scenario.price.toFixed(2)} €</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart({ type: 'scenario', item: scenario, saga });
                  }}
                  className="w-full bg-amber-800 text-white px-6 py-4 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-bold text-lg">
                  <ShoppingCart size={24} />Ajouter au panier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioEditModal = ({ scenario, saga, onSave, onClose }) => {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-amber-900">
            {scenario ? '✏️ Modifier' : '➕ Créer'} un scénario
          </h2>
          <button onClick={onClose} className="text-amber-900 hover:text-amber-700 text-2xl">
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-amber-900 font-bold mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 border-2 border-amber-700 rounded focus:outline-none focus:border-amber-900"
                placeholder="Ajouter un tag..."
              />
              <button 
                type="button"
                onClick={addTag}
                className="bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700">
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedScenario.tags.map((tag, i) => (
                <span key={i} className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-700">×</button>
                </span>
              ))}
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
  const total = cart.reduce((sum, item) => sum + (item.type === 'saga' ? item.item.price : item.item.price), 0);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-amber-100 border-l-4 border-amber-900 shadow-2xl z-50 flex flex-col">
      <div className="p-6 border-b-2 border-amber-700 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-900">🛒 Panier</h2>
        <button onClick={onClose} className="text-amber-900 hover:text-amber-700 text-2xl">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={64} className="mx-auto text-amber-400 mb-4" />
            <p className="text-amber-700 text-lg">Votre panier est vide</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((cartItem, index) => (
              <div key={index} className="bg-amber-50 border-2 border-amber-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900">
                      {cartItem.type === 'saga' ? cartItem.item.name : cartItem.item.displayName}
                    </h3>
                    {cartItem.type === 'scenario' && <p className="text-sm text-amber-700">De : {cartItem.saga.name}</p>}
                    {cartItem.type === 'saga' && <p className="text-sm text-amber-700">{cartItem.item.scenarios.length} scénarios</p>}
                  </div>
                  <button onClick={() => onRemoveItem(index)} className="text-red-700 hover:text-red-900">
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-amber-800">
                    {(cartItem.type === 'saga' ? cartItem.item.price : cartItem.item.price).toFixed(2)} €
                  </span>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
      
      {cart.length > 0 && (
        <div className="border-t-2 border-amber-700 p-6 bg-amber-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-amber-900">Total</span>
            <span className="text-3xl font-bold text-amber-800">{total.toFixed(2)} €</span>
          </div>
          <button 
            onClick={onGoToCheckout}
            className="w-full bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-bold text-lg flex items-center justify-center gap-2">
            <CreditCard size={20} />Procéder au paiement
          </button>
        </div>
      )}
    </div>
  );
};

const CheckoutPage = ({ cart, onBack, onOrderComplete }) => {
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
    if (!formData.firstName.trim()) errors.firstName = "Prénom requis";
    if (!formData.lastName.trim()) errors.lastName = "Nom requis";
    if (!formData.email.trim()) errors.email = "Email requis";
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email invalide";
    if (formData.email !== formData.confirmEmail) errors.confirmEmail = "Les emails ne correspondent pas";
    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length !== 16) errors.cardNumber = "Numéro invalide";
    if (!formData.cvv.trim() || formData.cvv.length !== 3) errors.cvv = "CVV invalide";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onOrderComplete(formData);
      }, 2000);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: null });
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={onBack} className="mb-6 bg-amber-800 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2">
          <ChevronLeft size={20} />Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-amber-100 border-4 border-amber-900 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-6">💳 Paiement</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4">Informations</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">Prénom *</label>
                    <input type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-4 py-2 border-2 rounded ${formErrors.firstName ? 'border-red-500' : 'border-amber-700'}`} />
                    {formErrors.firstName && <p className="text-red-600 text-sm mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">Nom *</label>
                    <input type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-4 py-2 border-2 rounded ${formErrors.lastName ? 'border-red-500' : 'border-amber-700'}`} />
                    {formErrors.lastName && <p className="text-red-600 text-sm mt-1">{formErrors.lastName}</p>}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-amber-900 font-bold mb-2">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded ${formErrors.email ? 'border-red-500' : 'border-amber-700'}`} />
                  {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
                </div>
                
                <div className="mt-4">
                  <label className="block text-amber-900 font-bold mb-2">Confirmer email *</label>
                  <input type="email" value={formData.confirmEmail} onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded ${formErrors.confirmEmail ? 'border-red-500' : 'border-amber-700'}`} />
                  {formErrors.confirmEmail && <p className="text-red-600 text-sm mt-1">{formErrors.confirmEmail}</p>}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4">Paiement</h2>
                <div>
                  <label className="block text-amber-900 font-bold mb-2">Numéro de carte *</label>
                  <input type="text" value={formData.cardNumber} onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456" maxLength="19"
                    className={`w-full px-4 py-2 border-2 rounded ${formErrors.cardNumber ? 'border-red-500' : 'border-amber-700'}`} />
                  {formErrors.cardNumber && <p className="text-red-600 text-sm mt-1">{formErrors.cardNumber}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">Expiration *</label>
                    <input type="text" value={formData.expiryDate} onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/AA" maxLength="5" className="w-full px-4 py-2 border-2 border-amber-700 rounded" />
                  </div>
                  <div>
                    <label className="block text-amber-900 font-bold mb-2">CVV *</label>
                    <input type="text" value={formData.cvv} onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substr(0, 3))}
                      placeholder="123" maxLength="3"
                      className={`w-full px-4 py-2 border-2 rounded ${formErrors.cvv ? 'border-red-500' : 'border-amber-700'}`} />
                    {formErrors.cvv && <p className="text-red-600 text-sm mt-1">{formErrors.cvv}</p>}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isProcessing}
                className="w-full bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <>⏳ Traitement...</> : <><CreditCard size={20} />Payer {total.toFixed(2)} €</>}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1 bg-amber-100 border-4 border-amber-900 rounded-lg p-6 sticky top-4">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">📋 Récapitulatif</h2>
            <div className="space-y-3 mb-6">
              {cart.map((item, i) => (
                <div key={i} className="border-b-2 border-amber-700 pb-3">
                  <div className="font-bold text-amber-900">{item.type === 'saga' ? item.item.name : item.item.displayName}</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">{item.type === 'saga' ? `${item.item.scenarios.length} scénarios` : 'Scénario'}</span>
                    <span className="font-bold text-amber-800">{(item.type === 'saga' ? item.item.price : item.item.price).toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-amber-900 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-amber-900">Total</span>
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
  const total = cart.reduce((sum, item) => sum + (item.type === 'saga' ? item.item.price : item.item.price), 0);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-amber-100 border-4 border-amber-900 rounded-lg p-10 text-center shadow-2xl">
        <div className="text-green-600 mb-6"><Check size={80} className="mx-auto" strokeWidth={3} /></div>
        <h1 className="text-4xl font-bold text-amber-900 mb-4">Commande confirmée !</h1>
        <p className="text-xl text-amber-700 mb-8">Merci {orderData.firstName} !</p>

        <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">📧 Email envoyé</h2>
          <p className="text-amber-800">Confirmation à : <strong>{orderData.email}</strong></p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-700 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-amber-900 mb-4">📦 Commande</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-amber-300">
              <span>{item.type === 'saga' ? item.item.name : item.item.displayName}</span>
              <span className="font-bold">{(item.type === 'saga' ? item.item.price : item.item.price).toFixed(2)} €</span>
            </div>
          ))}
          <div className="flex justify-between pt-4 border-t-2 border-amber-700 mt-4">
            <span className="text-xl font-bold">Total</span>
            <span className="text-2xl font-bold text-green-700">{total.toFixed(2)} €</span>
          </div>
        </div>

        <button onClick={onBackToHome} className="bg-amber-800 text-white px-8 py-4 rounded-lg hover:bg-amber-700 font-bold text-lg">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

// Page de Login pour l'admin
const LoginPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mot de passe par défaut : "admin123" - peut être changé dans le localStorage
    const adminPassword = localStorage.getItem('le-codex-admin-password') || 'admin123';
    
    if (password === adminPassword) {
      localStorage.setItem('le-codex-admin-auth', 'true');
      navigate('/admin');
    } else {
      setError('Mot de passe incorrect');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-amber-100 border-4 border-amber-900 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Lock size={64} className="mx-auto text-amber-800 mb-4" />
          <h1 className="text-3xl font-bold text-amber-900">Accès Admin</h1>
          <p className="text-amber-700 mt-2">Entrez le mot de passe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-amber-900 font-bold mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg focus:outline-none focus:border-amber-900"
              placeholder="Entrez le mot de passe..."
              autoFocus
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-bold text-lg">
            🔓 Se connecter
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-bold">
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

// Composant pour la page d'accueil dans l'admin
const PageAccueilTab = ({ themes, setThemes }) => {
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
      
      // Recharger les thèmes depuis Supabase pour avoir les données à jour
      const updatedThemes = await supabaseService.getThemes();
      setThemes(updatedThemes);
      setEditedThemes(updatedThemes);
      
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

// Composant pour protéger les routes admin
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('le-codex-admin-auth') === 'true';
  return isAuth ? children : <Navigate to="/login" replace />;
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
  // Charger les données depuis Supabase
  const { campaigns, themes: supabaseThemes, siteSettings: supabaseSiteSettings, loading, error } = useSupabaseData();
  
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
  const [orderData, setOrderData] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingSaga, setEditingSaga] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [selectedSagaIdForScenarios, setSelectedSagaIdForScenarios] = useState(null);
  const [clickedButtons, setClickedButtons] = useState({});
  const [viewingScenario, setViewingScenario] = useState(null);
  
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
  
  const handleDownloadFree = (pdfUrl, name) => {
    if (pdfUrl) {
      alert(`Téléchargement de "${name}" en cours...`);
    } else {
      alert('PDF non disponible');
    }
  };

  const saveCampaign = async (campaignData) => {
    // Valider et nettoyer le themeId
    const validThemeIds = ['medieval', 'lovecraft', 'scifi'];
    const cleanThemeId = String(campaignData.themeId || 'medieval').trim().toLowerCase();
    const finalThemeId = validThemeIds.includes(cleanThemeId) ? cleanThemeId : 'medieval';
    
    const validCampaign = {
      ...campaignData,
      themeId: finalThemeId,
      id: campaignData.id || Date.now() // S'assurer qu'il y a un ID unique
    };
    
    try {
      if (editingSaga) {
        // Modifier dans Supabase
        await supabaseService.updateCampaign(validCampaign.id, validCampaign);
      } else {
        // Créer dans Supabase
        await supabaseService.createCampaign(validCampaign);
      }
      
      // Le hook useSupabaseData va recharger automatiquement
      setShowCampaignModal(false);
      setEditingSaga(null);
    } catch (error) {
      console.error('Erreur sauvegarde campagne:', error);
      alert('❌ Erreur lors de la sauvegarde de la campagne');
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
        await supabaseService.updateScenario(
          selectedSagaIdForScenarios,
          scenarioData.id,
          scenarioData
        );
      } else {
        // Ajouter un nouveau scénario dans Supabase
        await supabaseService.addScenario(
          selectedSagaIdForScenarios,
          scenarioData
        );
      }
      
      setShowScenarioModal(false);
      setEditingScenario(null);
      // Le hook useSupabaseData va recharger automatiquement
    } catch (error) {
      console.error('Erreur sauvegarde scénario:', error);
      alert('❌ Erreur lors de la sauvegarde du scénario');
    }
  };

  const deleteScenario = async (sagaId, scenarioId) => {
    if (confirm('Supprimer ce scénario ?')) {
      try {
        await supabaseService.deleteScenario(sagaId, scenarioId);
        // Le hook useSupabaseData va recharger automatiquement
      } catch (error) {
        console.error('Erreur suppression scénario:', error);
        alert('❌ Erreur lors de la suppression du scénario');
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
    <div className="min-h-screen bg-slate-900">
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
        />
      )}

      {!showBook && currentPage !== 'checkout' && currentPage !== 'confirmation' && (
        <nav className="fixed top-0 left-0 right-0 bg-gradient-to-b from-slate-950 to-slate-900 text-amber-200 shadow-2xl z-50 border-b-4 border-amber-900/70">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setCurrentPage('home')} className="group flex items-center gap-4 hover:scale-105 transition-transform">
              {siteSettings.logoUrl ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt={siteSettings.siteName}
                  className="h-16 w-16 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="text-5xl">📚</div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold text-amber-300 group-hover:text-amber-400 transition-colors">
                  {siteSettings.siteName}
                </span>
                {siteSettings.tagline && (
                  <span className="text-xs text-amber-500">{siteSettings.tagline}</span>
                )}
              </div>
            </button>
            <div className="flex gap-4 items-center">
              {['home', 'submit', 'admin', 'stats', 'about']
                .filter(page => {
                  // Masquer Admin et Stats si non connecté
                  const isAuth = localStorage.getItem('le-codex-admin-auth') === 'true';
                  if ((page === 'admin' || page === 'stats') && !isAuth) {
                    return false;
                  }
                  return true;
                })
                .map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} 
                  className={`px-4 py-2 rounded transition-all ${currentPage === page ? 'bg-amber-900 text-amber-100 shadow-lg' : 'hover:bg-slate-800 text-amber-200'}`}>
                  {page === 'home' && 'Accueil'}
                  {page === 'submit' && 'Proposer'}
                  {page === 'admin' && 'Admin'}
                  {page === 'stats' && 'Stats'}
                  {page === 'about' && 'À propos'}
                </button>
              ))}
              
              <button onClick={() => setShowCart(!showCart)} className="relative px-4 py-2 rounded bg-green-800 hover:bg-green-700 text-white flex items-center gap-2">
                <ShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
              
              {/* Bouton de déconnexion si authentifié */}
              {localStorage.getItem('le-codex-admin-auth') === 'true' && (
                <button 
                  onClick={() => {
                    if (confirm('Voulez-vous vous déconnecter ?')) {
                      localStorage.removeItem('le-codex-admin-auth');
                      setCurrentPage('home');
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white flex items-center gap-2"
                  title="Se déconnecter de l'administration">
                  <Lock size={18} />
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {showCart && currentPage !== 'checkout' && currentPage !== 'confirmation' && (
        <ShoppingCartPanel cart={cart} onRemoveItem={removeFromCart} onClose={() => setShowCart(false)} onGoToCheckout={goToCheckout} />
      )}

      <div className={!showBook && currentPage !== 'checkout' && currentPage !== 'confirmation' ? 'pt-20' : ''}>
        {currentPage === 'confirmation' && orderData && (
          <OrderConfirmationPage orderData={orderData} cart={cart} onBackToHome={backToHome} />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage cart={cart} onBack={() => { setCurrentPage('home'); setShowCart(true); }} onOrderComplete={handleOrderComplete} />
        )}

        {/* PAGE ACCUEIL */}
        {!showBook && currentPage === 'home' && (
          <div className="min-h-screen flex">
            {themes.map((theme, idx) => (
              <div key={theme.id} onClick={() => { setCurrentTheme(theme); openBook(theme); }}
                className="flex-1 flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out hover:flex-[1.5] group relative overflow-hidden"
                style={{backgroundColor: idx === 0 ? '#78350f' : '#020617'}}>
                {/* Image d'arrière-plan avec effets */}
                <div className="absolute inset-0 transition-all duration-700">
                  <img 
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
                <div className="relative z-10 text-center p-8 transform transition-all duration-500 group-hover:scale-110">
                  <h2 className={`text-6xl font-bold mb-4 drop-shadow-2xl transition-all duration-500 ${
                    idx === 0 ? 'text-amber-300' : idx === 1 ? 'text-emerald-400' : 'text-cyan-400'
                  }`} style={{textShadow: '0 0 30px rgba(251, 191, 36, 0.5), 3px 3px 6px rgba(0,0,0,1)'}}>
                    {theme.name}
                  </h2>
                  <p className={`text-xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                    idx === 0 ? 'text-amber-200' : idx === 1 ? 'text-emerald-300' : 'text-cyan-300'
                  }`}>Cliquez pour explorer</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGE PROPOSER - Formulaire de soumission REDESIGN */}
        {!showBook && currentPage === 'submit' && (
          <div className="min-h-screen p-8" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          }}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block bg-gradient-to-r from-amber-500 to-amber-700 text-transparent bg-clip-text mb-4">
                  <h1 className="text-6xl font-bold">✨ Proposer un Scénario</h1>
                </div>
                <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-700 mx-auto rounded-full mb-6"></div>
                <p className="text-amber-300 text-xl">Partagez votre création avec la communauté !</p>
              </div>
              
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-8 shadow-2xl">
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  const pdfFile = e.target.pdfFile.files[0];
                  if (!pdfFile) {
                    alert('❌ Veuillez sélectionner un fichier PDF');
                    return;
                  }
                  
                  if (pdfFile.type !== 'application/pdf') {
                    alert('❌ Seuls les fichiers PDF sont acceptés');
                    return;
                  }
                  
                  // Afficher un indicateur de chargement
                  const submitButton = e.target.querySelector('button[type="submit"]');
                  const originalButtonText = submitButton.innerHTML;
                  submitButton.disabled = true;
                  submitButton.innerHTML = '⏳ Envoi en cours...';
                  
                  try {
                    const submissionData = {
                      scenarioName: e.target.scenarioName.value,
                      author: e.target.author.value,
                      email: e.target.email.value,
                      summary: e.target.summary.value
                    };
                    
                    // Uploader vers Supabase (Storage + Database)
                    await supabaseService.createSubmission(submissionData, pdfFile);
                    
                    alert('✅ Votre scénario a été soumis avec succès !\n\n📧 Nous reviendrons vers vous par email sous 48h.\n🔒 Votre PDF est stocké en sécurité sur nos serveurs.');
                    e.target.reset();
                  } catch (error) {
                    console.error('Erreur soumission:', error);
                    alert('❌ Erreur lors de l\'envoi de votre soumission.\n\nVeuillez réessayer ou nous contacter si le problème persiste.');
                  } finally {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                  }
                }} className="space-y-6">
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">Nom du scénario *</label>
                    <input 
                      type="text" 
                      name="scenarioName"
                      required 
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" 
                      placeholder="Le titre de votre scénario"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">Auteur *</label>
                    <input 
                      type="text" 
                      name="author"
                      required 
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" 
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">Email *</label>
                    <input 
                      type="email" 
                      name="email"
                      required 
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" 
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">Résumé *</label>
                    <textarea 
                      rows="5" 
                      name="summary"
                      required 
                      className="w-full px-4 py-3 border-2 border-amber-500/30 bg-slate-700/50 text-amber-100 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" 
                      placeholder="Décrivez votre scénario..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-2">Fichier PDF * (PDF uniquement)</label>
                    <div className="border-2 border-dashed border-amber-500/30 rounded-lg p-6 text-center bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <input 
                        type="file" 
                        name="pdfFile"
                        accept=".pdf,application/pdf" 
                        required 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.type !== 'application/pdf') {
                            alert('❌ Erreur : Seuls les fichiers PDF sont acceptés !');
                            e.target.value = '';
                          }
                        }}
                        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-700 file:text-white file:cursor-pointer file:hover:bg-amber-600 file:transition-colors"
                      />
                      <p className="text-xs text-amber-300 mt-2">📄 Format accepté : PDF uniquement</p>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-4 rounded-lg hover:from-amber-500 hover:to-amber-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    ✨ Soumettre mon scénario
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* PAGE ADMIN - COMPLETE AVEC TOUS LES ONGLETS */}
        {!showBook && currentPage === 'admin' && (
          <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-5xl font-bold mb-8 text-amber-300 text-center">🛠️ Administration</h1>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {[
                  {id: 'campagnes', icon: '📚', label: 'Campagnes'},
                  {id: 'scenarios', icon: '📖', label: 'Scénarios'},
                  {id: 'pageaccueil', icon: '🏠', label: 'Page Accueil'},
                  {id: 'visuel', icon: '🎨', label: 'Visuel'},
                  {id: 'notations', icon: '⭐', label: 'Notations'},
                  {id: 'images', icon: '🖼️', label: 'Images'},
                  {id: 'soumissions', icon: '📥', label: 'Soumissions'},
                  {id: 'parametres', icon: '⚙️', label: 'Paramètres'}
                ].map(tab => (
                  <button key={tab.id} onClick={() => setAdminTab(tab.id)}
                    className={`px-6 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      adminTab === tab.id ? 'bg-amber-800 text-white shadow-xl' : 'bg-amber-200 text-amber-900'
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-amber-100 border-4 border-amber-900 rounded-2xl p-8 shadow-2xl min-h-96">
                
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
                                        #{index + 1}
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
                  <PageAccueilTab themes={themes} setThemes={setThemes} />
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
                        <input type="email" defaultValue="contact@lecodex-jdr.fr" className="w-full px-4 py-3 border-2 border-amber-700 rounded-lg text-lg"/>
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

        {/* PAGE STATS - COMPLETE */}
        {!showBook && currentPage === 'stats' && (
          <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-5xl font-bold mb-8 text-amber-300 text-center">📊 Statistiques</h1>
              
              <div className="flex justify-center gap-4 mb-8">
                {['general', 'medieval', 'lovecraft', 'scifi'].map(tab => (
                  <button key={tab} onClick={() => setStatsTab(tab)}
                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                      statsTab === tab ? 'bg-amber-800 text-white shadow-xl' : 'bg-amber-200 text-amber-900'
                    }`}>
                    {tab === 'general' && '📊 Général'}
                    {tab === 'medieval' && '⚔️ Médiéval'}
                    {tab === 'lovecraft' && '👁️ Lovecraft'}
                    {tab === 'scifi' && '🚀 Sci-Fi'}
                  </button>
                ))}
              </div>

              {statsTab === 'general' && (
                <div>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-100 border-4 border-blue-700 rounded-lg p-6 text-center shadow-xl">
                      <div className="text-5xl mb-3">👁️</div>
                      <h3 className="text-xl font-bold text-blue-900 mb-2">Visites</h3>
                      <p className="text-4xl font-bold text-blue-800">1,247</p>
                      <p className="text-sm text-blue-600 mt-2">+12% vs hier</p>
                    </div>
                    <div className="bg-purple-100 border-4 border-purple-700 rounded-lg p-6 text-center shadow-xl">
                      <div className="text-5xl mb-3">📖</div>
                      <h3 className="text-xl font-bold text-purple-900 mb-2">Consultations</h3>
                      <p className="text-4xl font-bold text-purple-800">3,892</p>
                      <p className="text-sm text-purple-600 mt-2">Cette semaine</p>
                    </div>
                    <div className="bg-green-100 border-4 border-green-700 rounded-lg p-6 text-center shadow-xl">
                      <div className="text-5xl mb-3">⬇️</div>
                      <h3 className="text-xl font-bold text-green-900 mb-2">Téléchargements</h3>
                      <p className="text-4xl font-bold text-green-800">856</p>
                      <p className="text-sm text-green-600 mt-2">Ce mois</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-6 shadow-xl">
                      <h2 className="text-2xl font-bold mb-4 text-amber-900">🌍 Répartition</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span>🇫🇷 France</span><span className="font-bold">68%</span></div>
                        <div className="flex justify-between"><span>🇧🇪 Belgique</span><span className="font-bold">15%</span></div>
                        <div className="flex justify-between"><span>🇨🇭 Suisse</span><span className="font-bold">8%</span></div>
                        <div className="flex justify-between"><span>🇨🇦 Canada</span><span className="font-bold">6%</span></div>
                      </div>
                    </div>
                    <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-6 shadow-xl">
                      <h2 className="text-2xl font-bold mb-4 text-amber-900">⏰ Heures de Pointe</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span>20h - 22h</span><span className="font-bold">32%</span></div>
                        <div className="flex justify-between"><span>18h - 20h</span><span className="font-bold">24%</span></div>
                        <div className="flex justify-between"><span>14h - 16h</span><span className="font-bold">18%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {statsTab !== 'general' && (
                <div className="bg-amber-100 border-4 border-amber-900 rounded-lg p-8 text-center shadow-xl">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-amber-900 mb-2">Statistiques {statsTab}</h2>
                  <p className="text-amber-700">Données à venir...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE À PROPOS - REDESIGN MODERNE */}
        {!showBook && currentPage === 'about' && (
          <div className="min-h-screen p-8" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-block bg-gradient-to-r from-amber-500 to-amber-700 text-transparent bg-clip-text mb-4">
                  <h1 className="text-7xl font-bold">À Propos</h1>
                </div>
                <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-amber-700 mx-auto rounded-full"></div>
              </div>
              
              <div className="space-y-10 text-amber-900">
                <section className="text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h2 className="text-3xl font-bold mb-4">Qui sommes-nous ?</h2>
                  <p className="text-lg leading-relaxed">
                    Nous sommes une équipe passionnée de maîtres du jeu et de créateurs de contenu dédiés à l'univers du jeu de rôle. 
                    Notre amour pour la narration collaborative et les aventures épiques nous pousse à partager nos créations 
                    avec la communauté rôliste francophone.
                  </p>
                </section>

                <section className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-3xl font-bold mb-4">Notre Objectif</h2>
                  <p className="text-lg leading-relaxed">
                    Cette bibliothèque a été conçue pour offrir des scénarios de jeu de rôle d'exception. 
                    Chaque scénario est soigneusement examiné, noté selon plusieurs critères (ambiance, complexité, combat, enquête), 
                    et validé par notre équipe avant publication. Nous privilégions la qualité à la quantité : 
                    seuls les meilleurs scénarios trouvent leur place dans notre collection.
                  </p>
                </section>

                <section className="text-center">
                  <div className="text-6xl mb-4">✍️</div>
                  <h2 className="text-3xl font-bold mb-4">L'Auteur</h2>
                  <p className="text-lg leading-relaxed">
                    Maître de jeu depuis plus de dix ans, j'ai exploré de nombreux univers et systèmes de jeu. 
                    Ma philosophie : créer des aventures mémorables qui laissent une empreinte durable dans l'esprit des joueurs.
                  </p>
                </section>

                <section className="text-center">
                  <div className="text-6xl mb-4">⚙️</div>
                  <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
                  <div className="space-y-3 text-left max-w-2xl mx-auto">
                    <p className="flex items-start gap-3">
                      <span className="text-amber-800 font-bold text-xl">1.</span>
                      <span><strong>Explorez</strong> - Parcourez notre collection par thème</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-amber-800 font-bold text-xl">2.</span>
                      <span><strong>Évaluez</strong> - Consultez nos notations détaillées</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-amber-800 font-bold text-xl">3.</span>
                      <span><strong>Téléchargez</strong> - Accédez gratuitement ou achetez les PDFs</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-amber-800 font-bold text-xl">4.</span>
                      <span><strong>Proposez</strong> - Soumettez vos créations</span>
                    </p>
                  </div>
                </section>

                <section className="text-center border-t-2 border-amber-700 pt-8">
                  <div className="text-5xl mb-4">📧</div>
                  <h2 className="text-2xl font-bold mb-3">Contact</h2>
                  <p className="text-xl font-semibold text-amber-800">contact@lecodex-jdr.fr</p>
                </section>

                <section className="text-center pt-6">
                  <p className="text-sm text-amber-700">© 2024 Le Codex - Tous droits réservés</p>
                  <p className="text-xs text-amber-600 mt-2">Fait avec ❤️ pour la communauté</p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* PAGE SCENARIOS */}
        {showBook && (
          <div className={`min-h-screen relative overflow-hidden ${
            currentTheme.id === 'medieval' ? 'bg-gradient-to-b from-amber-950 via-amber-900 to-stone-900' :
            currentTheme.id === 'lovecraft' ? 'bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950' :
            'bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950'
          }`}>
            {/* Texture d'arrière-plan selon le thème */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: currentTheme.id === 'medieval' 
                ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                : currentTheme.id === 'lovecraft'
                ? 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
                : 'linear-gradient(45deg, rgba(6, 182, 212, 0.05) 25%, transparent 25%, transparent 75%, rgba(6, 182, 212, 0.05) 75%)'
            }}></div>

            {/* Bouton retour flottant selon le thème */}
            <button 
              onClick={closeBook} 
              className={`fixed top-6 left-6 z-50 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 transition-all shadow-2xl hover:scale-105 border-2 ${
                currentTheme.id === 'medieval' 
                  ? 'bg-amber-800/90 hover:bg-amber-700 text-amber-100 border-amber-600 hover:border-amber-400' :
                currentTheme.id === 'lovecraft'
                  ? 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border-emerald-600 hover:border-emerald-400' :
                  'bg-cyan-900/90 hover:bg-cyan-800 text-cyan-100 border-cyan-600 hover:border-cyan-400'
              }`}>
              <ChevronLeft size={20} />
              <span className="font-bold">Retour</span>
            </button>

            {/* En-tête avec titre du thème - Stylisé selon le thème */}
            <div className="pt-24 pb-8 text-center relative">
              <h1 className={`text-6xl font-bold mb-3 drop-shadow-2xl ${
                currentTheme.id === 'medieval' 
                  ? 'text-amber-300 font-serif' :
                currentTheme.id === 'lovecraft'
                  ? 'text-emerald-300 font-mono tracking-wider' :
                  'text-cyan-300 font-sans tracking-widest'
              }`} style={{
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
              <p className={`text-xl ${
                currentTheme.id === 'medieval' ? 'text-amber-400 font-serif italic' :
                currentTheme.id === 'lovecraft' ? 'text-emerald-400 font-mono' :
                'text-cyan-400 tracking-wide'
              }`}>
                {currentTheme.id === 'medieval' && '« Sélectionnez votre épopée »'}
                {currentTheme.id === 'lovecraft' && '[ Choisissez votre cauchemar ]'}
                {currentTheme.id === 'scifi' && '// SÉLECTIONNEZ VOTRE MISSION //'}
              </p>
            </div>

            {/* Menu horizontal des campagnes - Thématique selon section */}
            <div className={`sticky top-0 z-40 py-6 mb-8 ${
              currentTheme.id === 'medieval' ? 'bg-gradient-to-b from-amber-950/95 via-amber-900/90 to-transparent' :
              currentTheme.id === 'lovecraft' ? 'bg-gradient-to-b from-slate-950/95 via-emerald-950/90 to-transparent' :
              'bg-gradient-to-b from-slate-950/95 via-cyan-950/90 to-transparent'
            }`}>
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
                                <span className={`text-lg ${
                                  currentTheme.id === 'medieval' ? 'font-serif' :
                                  currentTheme.id === 'lovecraft' ? 'font-mono' :
                                  ''
                                }`}>{saga.name}</span>
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

            {/* Image de fond spécifique à la campagne si définie */}
            {selectedSaga && selectedSaga.backgroundImageUrl && (
              <div className="fixed inset-0 z-0 opacity-20">
                <img 
                  src={selectedSaga.backgroundImageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                  style={{ filter: 'blur(20px)' }}
                />
              </div>
            )}

            <div className="px-6 pb-12 relative z-10">
              {selectedSaga ? (
                <>
                  {/* Offre campagne complète */}
                  <div className="max-w-4xl mx-auto mb-8">
                    {selectedSaga.isFree ? (
                        <div className="bg-green-100 border-4 border-green-700 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-green-900">📥 Campagne complète</h3>
                              <p className="text-green-700 mt-1">{selectedSaga.scenarios.length} scénarios inclus</p>
                            </div>
                            <span className="text-4xl font-bold text-green-800">GRATUIT</span>
                          </div>
                          <button 
                            onClick={() => handleDownloadFree(selectedSaga.pdfUrl, selectedSaga.name)}
                            className="w-full bg-green-700 text-white px-6 py-4 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-bold text-lg">
                            <Download size={24} />Télécharger la campagne complète (PDF)
                          </button>
                        </div>
                      ) : (
                        <div className="bg-amber-200 border-4 border-amber-800 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-amber-900">🛒 Campagne complète</h3>
                              <p className="text-amber-700 mt-1">{selectedSaga.scenarios.length} scénarios · Économisez {((selectedSaga.scenarios.filter(s => !s.isFree).reduce((sum, s) => sum + s.price, 0) - selectedSaga.price).toFixed(2))} €</p>
                            </div>
                            <span className="text-4xl font-bold text-amber-800">{selectedSaga.price.toFixed(2)} €</span>
                          </div>
                          <button 
                            onClick={() => addToCart({ type: 'saga', item: selectedSaga })}
                            className="w-full bg-amber-800 text-white px-6 py-4 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-bold text-lg">
                            <ShoppingCart size={24} />Ajouter la campagne au panier
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <h2 className="text-4xl font-bold text-amber-300 mb-4">{currentTheme.name}</h2>
                    <div className="max-w-2xl mx-auto bg-amber-100 border-4 border-amber-900 rounded-lg p-12 shadow-2xl">
                      <div className="text-8xl mb-6">📚</div>
                      <h3 className="text-3xl font-bold text-amber-900 mb-4">Aucune campagne disponible</h3>
                      <p className="text-xl text-amber-700 mb-8">
                        Cette section ne contient pas encore de campagne.<br/>
                        Revenez plus tard ou ajoutez-en une depuis l'administration.
                      </p>
                      <button 
                        onClick={() => setCurrentPage('admin')}
                        className="bg-amber-800 text-white px-8 py-4 rounded-lg hover:bg-amber-700 font-bold text-lg inline-flex items-center gap-2">
                        <Plus size={24} />
                        Ajouter une campagne
                      </button>
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

              {/* Grille de scénarios */}
              {selectedSaga && selectedSaga.scenarios && selectedSaga.scenarios.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedSaga.scenarios.map((scenario, index) => {
                    const sagaForCart = selectedSaga; // Capturer la saga pour le panier
                    return (
                    <div 
                      key={scenario.id} 
                      onClick={() => setViewingScenario(scenario)}
                      className="bg-amber-100 border-4 border-amber-900 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer hover:scale-[1.02] relative">
                    {/* Image */}
                    <div className="relative h-80">
                      <img src={scenario.imageUrl} alt={scenario.displayName} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-amber-800 text-white px-3 py-1 rounded-full font-bold">
                        #{index + 1}
                      </div>
                      {scenario.isFree && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                          GRATUIT
                        </div>
                      )}
                    </div>

                    {/* Contenu avec image de fond optionnelle */}
                    <div className="p-4 relative">
                      {/* Image de fond si définie */}
                      {scenario.backgroundImageUrl && (
                        <>
                          <div className="absolute inset-0 z-0">
                            <img 
                              src={scenario.backgroundImageUrl} 
                              alt=""
                              className="w-full h-full object-cover"
                              style={{ filter: 'blur(8px) brightness(0.4)' }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 z-0"></div>
                        </>
                      )}
                      
                      {/* Contenu par-dessus l'image de fond */}
                      <div className="relative z-10">
                      <h3 className="text-xl font-bold text-amber-900 mb-2">{scenario.displayName}</h3>
                      <p className="text-sm text-amber-700 mb-3 line-clamp-2">{scenario.description}</p>

                      {/* Infos */}
                      <div className="flex items-center gap-2 text-sm text-amber-700 mb-3">
                        <Clock size={16} />
                        <span>{scenario.duration}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {scenario.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="bg-amber-200 text-amber-900 px-2 py-1 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Notations */}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span>🌙</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= scenario.ratings.ambiance ? 'text-yellow-600' : 'text-gray-400'} fill={s <= scenario.ratings.ambiance ? "currentColor" : "none"} />)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🧩</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= scenario.ratings.complexite ? 'text-yellow-600' : 'text-gray-400'} fill={s <= scenario.ratings.complexite ? "currentColor" : "none"} />)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>⚔️</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= scenario.ratings.combat ? 'text-yellow-600' : 'text-gray-400'} fill={s <= scenario.ratings.combat ? "currentColor" : "none"} />)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🔍</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= scenario.ratings.enquete ? 'text-yellow-600' : 'text-gray-400'} fill={s <= scenario.ratings.enquete ? "currentColor" : "none"} />)}
                          </div>
                        </div>
                      </div>

                      {/* Bouton d'action */}
                      {scenario.isFree && (
                        <button 
                          onClick={() => handleDownloadFree(scenario.pdfUrl, scenario.displayName)}
                          className="w-full bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-bold">
                          <Download size={18} />Télécharger
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/test-supabase" element={<TestSupabase />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><App /></ProtectedRoute>} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
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
