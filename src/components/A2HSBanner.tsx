'use client';

import { useState, useEffect } from 'react';
import { usePlatform } from '@/hooks/usePlatform';

export function A2HSBanner() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const platform = usePlatform();

  useEffect(() => {
    const inStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    let cancelled = false;
    const init = async () => {
      if (cancelled) return;
      setIsStandalone(inStandaloneMode);

      if (cancelled) return;
      if (!inStandaloneMode && (platform === 'ios' || platform === 'android')) {
        const dismissed = sessionStorage.getItem('a2hs-dismissed');
        if (!dismissed) {
          setIsVisible(true);
        } else {
          setIsDismissed(true);
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [platform]);

  const dismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('a2hs-dismissed', 'true');
  };

  if (!isVisible || isDismissed && !isVisible) return null;

  const isIOS = platform === 'ios';

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl shadow-xl p-4 z-50"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      role="dialog" 
      aria-label="Adicionar à tela inicial"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isIOS ? 'bg-[var(--app-accent)]' : 'bg-green-600'}`}>
          <span className="text-white text-lg font-bold" aria-hidden="true">
            {isIOS ? '📱' : '⬇️'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--app-text)] text-sm">Adicione à tela inicial</h3>
          <p className="text-xs text-[var(--app-text-secondary)] mt-1">
            {isIOS ? (
              <>
                Toque em <strong>Compartilhar</strong> e depois <strong>Adicionar à Tela Inicial</strong>.
              </>
            ) : (
              <>
                Toque no menu <strong>⋮</strong> e depois <strong>Adicionar à tela inicial</strong>.
              </>
            )}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="w-11 h-11 flex items-center justify-center text-[var(--app-text-secondary)] hover:text-[var(--app-text)] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Fechar banner"
          title="Fechar banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
