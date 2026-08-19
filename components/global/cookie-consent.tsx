'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieConsent() {
  const pathname   = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setIsVisible(true);
  }, []);

  // ── Hide on all /admin routes ─────────────────────────────────────────────
  if (pathname.startsWith('/admin')) return null;

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDismiss = () => setIsVisible(false);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-green-900/95 to-green-800/95 backdrop-blur-md border-t border-white/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <p className="text-white font-semibold mb-2">Cookie Policy</p>
            <p className="text-green-100 text-sm leading-relaxed">
              We use cookies to help our website operate securely and reliably, improve system efficiency, and support marketing activities. For further information, please refer to our{' '}
              <a href="/cookies" className="text-lime-300 hover:text-lime-400 underline font-medium">Cookie Policy</a>
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Button onClick={handleDismiss} variant="ghost"
              className="text-green-100 hover:text-white hover:bg-white/10 border border-white/20">
              Decline
            </Button>
            <Button onClick={handleAccept}
              className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-green-950 font-bold">
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}