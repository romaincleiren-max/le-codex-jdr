import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PdfAction from '../components/PdfAction';
import { verifyPayment } from '../services/stripeService';
import { useLanguage } from '../i18n';

export const PaymentSuccessPage = () => {
  const [params] = useSearchParams(); const sessionId = params.get('session_id');
  const { language } = useLanguage(); const en = language === 'en';
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const [busy, setBusy] = useState(true); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false; let timer;
    setBusy(true); setError(''); setData(null);
    const check = async (count = 0) => {
      try {
        if (!sessionId) throw new Error(en ? 'Missing payment reference.' : 'Référence de paiement manquante.');
        const result = await verifyPayment(sessionId);
        if (cancelled) return;
        setData(result);
        if (!result.paid && count < 5) { timer = setTimeout(() => check(count + 1), 3000); return; }
      } catch (e) { if (!cancelled) setError(e.message); }
      if (!cancelled) setBusy(false);
    };
    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sessionId, attempt, en]);
  return <main className="min-h-screen bg-slate-900 text-amber-100 px-4 py-12">
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{data?.paid ? (en ? 'Your PDFs' : 'Vos PDF') : (en ? 'Payment verification' : 'Vérification du paiement')}</h1>
      {busy && <p role="status">{en ? 'Checking payment…' : 'Vérification du paiement en cours…'}</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {!busy && !data?.paid && <div className="space-y-3">
        {!error && <p>{en ? 'Payment has not been confirmed yet. Do not pay again.' : 'Le paiement n’est pas encore confirmé. Ne payez pas une seconde fois.'}</p>}
        <button onClick={() => setAttempt(n => n + 1)} className="rounded px-4 py-2 bg-amber-700">{en ? 'Check again' : 'Vérifier à nouveau'}</button>
      </div>}
      {data?.paid && <>
        <p>{en ? 'Payment confirmed. Choose a language for each PDF.' : 'Paiement confirmé. Choisissez la langue de chaque PDF.'}</p>
        <p className="text-sm">{en ? 'Keep this private page in your bookmarks. Available and future translations of these chapters are included.' : 'Conservez cette page privée dans vos favoris. Les traductions disponibles et futures de ces chapitres sont incluses.'}</p>
        {data.items.map(item => <section key={item.type + item.id} className="border border-amber-700 rounded-xl p-5">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <PdfAction item={item} type={item.type} languages={item.languages} sessionId={sessionId} />
        </section>)}
      </>}
      <Link to="/" className="inline-block underline">{en ? 'Back to the catalogue' : 'Retour au catalogue'}</Link>
    </div>
  </main>;
};
