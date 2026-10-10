import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PdfAction from '../components/PdfAction';
import { verifyPayment } from '../services/stripeService';
import { useLanguage } from '../i18n';

export const PaymentSuccessPage = () => {
  const [params] = useSearchParams(); const sessionId = params.get('session_id');
  const { t } = useLanguage();
  const [data, setData] = useState(null); const [error, setError] = useState('');
  const [busy, setBusy] = useState(true); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false; let timer;
    setBusy(true); setError(''); setData(null);
    const check = async (count = 0) => {
      try {
        if (!sessionId) throw new Error(t('receipt.missing'));
        const result = await verifyPayment(sessionId);
        if (cancelled) return;
        setData(result);
        if (!result.paid && count < 5) { timer = setTimeout(() => check(count + 1), 3000); return; }
      } catch (e) { if (!cancelled) setError(e.message); }
      if (!cancelled) setBusy(false);
    };
    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sessionId, attempt, t]);
  return <main className="min-h-screen bg-slate-900 text-amber-100 px-4 py-12">
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{data?.paid ? (t('receipt.pdfs')) : (t('receipt.verification'))}</h1>
      {busy && <p role="status">{t('receipt.checking')}</p>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {!busy && !data?.paid && <div className="space-y-3">
        {!error && <p>{t('receipt.pending')}</p>}
        <button onClick={() => setAttempt(n => n + 1)} className="rounded px-4 py-2 bg-amber-700">{t('receipt.retry')}</button>
      </div>}
      {data?.paid && <>
        <p>{t('receipt.confirmed')}</p>
        <p className="text-sm">{t('receipt.bookmark')}</p>
        {data.items.map(item => <section key={item.type + item.id} className="border border-amber-700 rounded-xl p-5">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <PdfAction item={item} type={item.type} languages={item.languages} sessionId={sessionId} />
        </section>)}
      </>}
      <Link to="/" className="inline-block underline">{t('receipt.back')}</Link>
    </div>
  </main>;
};
