export function pdfEditions(item) {
  const files = item.pdfFiles ?? item.pdf_files ?? ((item.pdfUrl || item.pdf_url) ? { fr: item.pdfUrl || item.pdf_url } : {});
  return Object.fromEntries(Object.entries(files).filter(([lang, path]) => /^[a-z]{2}(?:-[A-Z]{2})?$/.test(lang) && typeof path === 'string' && path.trim()));
}
export function languageName(code) {
  return ({ fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', it: 'Italiano', pt: 'Português', 'pt-BR': 'Português (Brasil)' })[code] || code;
}
export async function downloadPdf({ type, id, language, sessionId }) {
  const response = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, language, sessionId }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Téléchargement indisponible.');
  const url = new URL(data.downloadUrl);
  if (url.protocol !== 'https:' || url.origin !== new URL(import.meta.env.VITE_SUPABASE_URL).origin) throw new Error('Adresse de téléchargement invalide.');
  const link = document.createElement('a'); link.href = url.href; link.rel = 'noopener noreferrer'; link.target = '_blank';
  document.body.appendChild(link); link.click(); link.remove();
}
