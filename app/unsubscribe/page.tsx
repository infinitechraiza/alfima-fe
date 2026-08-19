'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, MailX } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [status, setStatus]   = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) { setStatus('invalid'); return; }

    const run = async () => {
      try {
        const res  = await fetch('/api/newsletter/unsubscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to unsubscribe.');
        setStatus('success');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Something went wrong.');
      }
    };

    run();
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#c0392b,#96281b)' }} />
        <div className="p-10 text-center">

          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">Unsubscribing…</h1>
              <p className="text-sm text-gray-500">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">You've been unsubscribed</h1>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">{email}</span> has been removed from our mailing list.
              </p>
              <p className="text-sm text-gray-400 mb-8">You won't receive any more emails from us.</p>
              <Link href="/"
                className="inline-block text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c0392b,#96281b)' }}>
                Back to Home
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-sm text-gray-500 mb-8">{message || 'We could not process your request. Please try again.'}</p>
              <Link href="/"
                className="inline-block text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c0392b,#96281b)' }}>
                Back to Home
              </Link>
            </>
          )}

          {status === 'invalid' && (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-5">
                <MailX className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">Invalid link</h1>
              <p className="text-sm text-gray-500 mb-8">This unsubscribe link appears to be invalid or expired.</p>
              <Link href="/"
                className="inline-block text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#c0392b,#96281b)' }}>
                Back to Home
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}