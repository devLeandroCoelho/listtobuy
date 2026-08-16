'use client';

import { useState } from 'react';
import { getCookieConsent, setCookieConsent } from '@/lib/cookies';

export function CookieConsent() {
  const [consent, setConsent] = useState(getCookieConsent);

  if (consent !== null) {
    return null;
  }

  const handleAccept = () => {
    setConsent('accepted');
    setCookieConsent('accepted');
  };

  const handleReject = () => {
    setConsent('rejected');
    setCookieConsent('rejected');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
      <div className="mx-auto max-w-3xl bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[var(--app-text)] mb-1">
              Cookies e Privacidade
            </h2>
            <p className="text-sm text-[var(--app-text-secondary)]">
              Utilizamos cookies essenciais para o funcionamento do site e cookies não essenciais para analytics e marketing.
              Ao clicar em &quot;Aceitar&quot;, você concorda com o uso de cookies não essenciais.
              Leia nossa <a href="/privacy" className="underline text-[var(--app-accent)]">Política de Privacidade</a>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReject}
              className="min-h-11 px-4 text-sm font-medium text-[var(--app-text)] border border-[var(--app-border)] rounded-lg hover:bg-[var(--app-muted)] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="min-h-11 px-4 text-sm font-medium text-white bg-[var(--app-accent)] rounded-lg hover:opacity-90 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
