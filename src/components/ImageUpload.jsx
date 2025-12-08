import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

/**
 * Composant d'upload d'images vers Supabase Storage
 * Supporte l'upload de fichiers et les URLs externes
 */
export const ImageUpload = ({ 
  value, 
  onChange, 
  label = "Image",
  folder = "general",
  aspectRatio = "auto",
  helpText = null
}) => {
  const [preview, setPreview] = useState(value || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Upload vers Supabase Storage
      const { url } = await supabaseService.uploadImage(file, folder);
      
      // Mettre à jour l'aperçu et notifier le parent
      setPreview(url);
      onChange(url);
      
    } catch (error) {
      console.error('Erreur upload:', error);
      setUploadError(error.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInput = (url) => {
    setPreview(url);
    onChange(url);
    setUploadError('');
  };

  const clearImage = () => {
    setPreview('');
    onChange('');
    setUploadError('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-amber-900 font-bold">{label}</label>
      
      {helpText && (
        <p className="text-sm text-amber-700">{helpText}</p>
      )}

      {!preview ? (
        <div className="space-y-4">
          {/* Option 1 : Upload fichier vers Supabase */}
          <div className="border-2 border-dashed border-amber-700 rounded-lg p-6 text-center bg-amber-50 hover:bg-amber-100 transition-colors">
            <div className="text-4xl mb-3">
              {uploading ? '⏳' : '📤'}
            </div>
            <p className="text-amber-900 mb-3 font-semibold">
              {uploading ? 'Upload en cours...' : 'Option 1 : Upload vers Supabase Storage'}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`imageUpload-${label.replace(/\s+/g, '-')}`}
            />
            <label
              htmlFor={`imageUpload-${label.replace(/\s+/g, '-')}`}
              className={`${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-amber-800 hover:bg-amber-700 cursor-pointer'
              } text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 font-bold`}
            >
              <Upload size={18} />
              {uploading ? 'Upload...' : 'Choisir une image'}
            </label>
            <p className="text-xs text-amber-700 mt-3">
              📁 JPG, PNG, GIF, WEBP • Max 5MB
            </p>
            {uploadError && (
              <p className="text-red-600 text-sm mt-2 font-semibold">❌ {uploadError}</p>
            )}
          </div>

          {/* Option 2 : URL externe (Imgur, etc.) */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-amber-800 hover:text-amber-900 font-semibold underline flex items-center gap-2 mx-auto"
            >
              <LinkIcon size={16} />
              {showUrlInput ? '▼' : '►'} Option 2 : Utiliser une URL externe
            </button>
          </div>

          {showUrlInput && (
            <div className="bg-blue-50 border-2 border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-3 flex items-start gap-2">
                <span className="text-xl">💡</span>
                <span>
                  <strong>Astuce :</strong> Uploadez votre image sur{' '}
                  <a 
                    href="https://imgur.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline font-bold hover:text-blue-700"
                  >
                    Imgur.com
                  </a>
                  {' '}puis collez l'URL ici (ou utilisez une URL déjà hébergée)
                </span>
              </p>
              <input
                type="url"
                placeholder="https://i.imgur.com/XXXXX.jpg"
                onChange={(e) => handleUrlInput(e.target.value)}
                className="w-full px-4 py-2 border-2 border-blue-700 rounded-lg focus:outline-none focus:border-blue-900"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border-4 border-amber-800 shadow-lg">
            <img
              src={preview}
              alt="Preview"
              className={`w-full object-cover ${
                aspectRatio === '16:9' ? 'aspect-video' :
                aspectRatio === '1:1' ? 'aspect-square' :
                aspectRatio === '9:16' ? 'h-96' :
                'h-64'
              }`}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                setUploadError('Impossible de charger l\'image');
              }}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-xl transition-all hover:scale-110"
              title="Supprimer l'image"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mt-3 bg-amber-50 p-3 rounded-lg border-2 border-amber-700">
            <div className="flex items-start gap-2">
              <ImageIcon size={16} className="text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-900 mb-1">URL de l'image :</p>
                <p className="text-xs text-amber-800 break-all">
                  {preview}
                </p>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={clearImage}
            className="mt-3 w-full text-sm text-amber-700 hover:text-amber-900 underline font-semibold py-2 bg-amber-50 rounded-lg border border-amber-700 hover:bg-amber-100 transition-colors"
          >
            🔄 Changer l'image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
