import React, { useEffect } from 'react';
import './ItemPanel.css';

// ══════════════════════════════════════════════════
// Couleurs par rareté
// ══════════════════════════════════════════════════
const RARITY_COLORS = {
  "Commun":     { badge: "#4A5568", badgeTxt: "#E2E8F0", name: "#A0AEB8", border: "#4A5568" },
  "Inhabituel": { badge: "#2D5016", badgeTxt: "#9AE6B4", name: "#6BAF4A", border: "#2D5016" },
  "Rare":       { badge: "#1A3A5C", badgeTxt: "#90CDF4", name: "#5FA8D3", border: "#1A3A5C" },
  "Très rare":  { badge: "#4A1F7A", badgeTxt: "#D6BCFA", name: "#9F7AEA", border: "#4A1F7A" },
  "Légendaire": { badge: "#7B4000", badgeTxt: "#FBD38D", name: "#C9A84C", border: "#7B4000" },
  "Artefact":   { badge: "#7B1010", badgeTxt: "#FEB2B2", name: "#FC8181", border: "#7B1010" },
};

const TYPE_ICONS = {
  "Arme": "⚔", "Armure": "🛡", "Objet merveilleux": "✨",
  "Parchemin": "📜", "Potion": "🧪", "Anneau": "💍",
  "Poison": "☠", "Artefact": "📖", "Sort": "🌀", "default": "◈"
};

// ══════════════════════════════════════════════════
// Composant ItemPanel
//
// Props:
//   item    — objet à afficher (null = panel vide)
//   onClose — callback fermeture
//   sticky  — true = position sticky (sidebar), false = flottant (défaut: true)
//
// Format d'un item :
//   { id, name, type, subtype?, rarity, attunement?, attunement_note?,
//     cursed?, weight?, cost?, description, image?, image_alt?,
//     properties?, stats: [{name, value, class}],
//     abilities: [{name, cost, text}], source?, found_at? }
// ══════════════════════════════════════════════════
export default function ItemPanel({ item, onClose, sticky = true }) {
  // Fermeture sur Échap
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const panelStyle = sticky
    ? { position: 'sticky', top: 0, height: '100vh' }
    : { position: 'fixed', top: 0, right: 0, height: '100vh', zIndex: 100 };

  return (
    <div
      className={`item-panel ${item ? '' : 'hidden'}`}
      style={panelStyle}
    >
      {!item ? (
        <div className="ip-empty">
          <div className="ornament">⚔</div>
          <p>Sélectionnez<br />un objet<br />pour afficher<br />sa fiche</p>
        </div>
      ) : (
        <ItemCard item={item} onClose={onClose} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// Fiche d'un objet
// ══════════════════════════════════════════════════
function ItemCard({ item, onClose }) {
  const rc = RARITY_COLORS[item.rarity] || RARITY_COLORS["Commun"];
  const icon = TYPE_ICONS[item.type] || TYPE_ICONS["default"];
  const subLabel = item.subtype ? `${item.type} — ${item.subtype}` : item.type;

  return (
    <div className="ip-card">
      <button className="ip-close" onClick={onClose}>✕</button>

      {/* Illustration */}
      <div className="ip-illus" style={{ borderBottomColor: rc.border }}>
        {item.image
          ? <img src={item.image} alt={item.image_alt || item.name} />
          : (
            <div className="ip-illus-placeholder">
              <div className="icon">{icon}</div>
              <div className="hint">Illustration à venir</div>
            </div>
          )
        }
        <div className="ip-rarity-badge" style={{ background: rc.badge, color: rc.badgeTxt }}>
          {item.rarity}
        </div>
        <div className="ip-illus-overlay">
          <span style={{ color: rc.name }}>{item.found_at || ''}</span>
        </div>
      </div>

      {/* Header */}
      <div className="ip-header" style={{ borderBottomColor: rc.border + '30' }}>
        <div className="ip-name" style={{ color: rc.name }}>{item.name}</div>
        <div className="ip-type">{icon} {subLabel}</div>
      </div>

      {/* Quick props */}
      <div className="ip-quick-props">
        <div className="ip-qp">
          <span className="ip-qp-label">Type</span>
          <span className="ip-qp-value">{subLabel}</span>
        </div>
        <div className="ip-qp">
          <span className="ip-qp-label">Rareté</span>
          <span className="ip-qp-value" style={{ color: rc.name }}>{item.rarity}</span>
        </div>
        {item.attunement && (
          <div className="ip-qp">
            <span className="ip-qp-label">Accordage</span>
            <span className="ip-qp-value danger">Requis</span>
          </div>
        )}
        {item.cost && item.cost !== '—' && (
          <div className="ip-qp">
            <span className="ip-qp-label">Valeur</span>
            <span className="ip-qp-value">{item.cost}</span>
          </div>
        )}
        {item.weight > 0 && (
          <div className="ip-qp">
            <span className="ip-qp-label">Poids</span>
            <span className="ip-qp-value">{item.weight} kg</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="ip-desc">{item.description}</div>

      {/* Propriétés */}
      {item.properties?.length > 0 && (
        <div className="ip-section">
          <div className="ip-section-title">Propriétés</div>
          <div className="ip-props-wrap">
            {item.properties.map((p, i) => (
              <span key={i} className="ip-prop-tag">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques */}
      {item.stats?.length > 0 && (
        <div className="ip-section">
          <div className="ip-section-title">Statistiques</div>
          {item.stats.map((s, i) => (
            <div key={i} className="ip-stat-row">
              <span className="ip-stat-name">{s.name}</span>
              <span className={`ip-stat-val ${s.class || ''}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Capacités */}
      {item.abilities?.length > 0 && (
        <div className="ip-section">
          <div className="ip-section-title">Capacités</div>
          {item.abilities.map((a, i) => (
            <div key={i} className="ip-ability">
              <div className="ip-ability-name">
                {a.name} <span className="ip-ability-cost">{a.cost}</span>
              </div>
              <div className="ip-ability-text">{a.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accordage note */}
      {item.attunement && item.attunement_note && (
        <div className="ip-attunement">
          <span className="ip-attunement-label">⚠ ACCORDAGE : </span>
          <span className="ip-attunement-note">{item.attunement_note}</span>
        </div>
      )}

      {/* Malédiction */}
      {item.cursed && (
        <div>
          <span className="ip-curse-tag">☠ OBJET MAUDIT</span>
        </div>
      )}

      {/* Source */}
      <div className="ip-source">
        <span>{item.found_at || ''}</span>
        <span>{item.source || ''}</span>
      </div>
    </div>
  );
}
