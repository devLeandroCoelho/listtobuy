'use client';

import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/LogoMark';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)] text-[var(--app-text)] px-4">
      <div className="text-center max-w-sm">
        <LogoMark size={64} variant="icon" className="mx-auto mb-6 opacity-80" />
        <h1 className="text-2xl font-bold mb-2 font-display">Você está offline</h1>
        <p className="text-[var(--app-text-secondary)] mb-6">
          Parece que você perdeu a conexão. Verifique sua internet e tente novamente.
        </p>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl font-medium shadow-sm hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {retrying ? 'Tentando...' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );
}
