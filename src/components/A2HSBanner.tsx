'use client';

import { useState, useEffect } from 'react';

export function A2HSBanner() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const inStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    let cancelled = false;
    const init = async () => {
      if (cancelled) return;
      setIsIOS(isIOSDevice);
      setIsStandalone(inStandaloneMode);

      if (cancelled) return;
      if (isIOSDevice && !inStandaloneMode) {
        const dismissed = sessionStorage.getItem('a2hs-dismissed');
        if (!dismissed) {
          setIsVisible(true);
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('a2hs-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl shadow-xl p-4 z-50" role="dialog" aria-label="Adicionar à tela inicial">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[var(--app-accent)] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-lg font-bold" aria-hidden="true">+</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--app-text)] text-sm">Adicione à tela inicial</h3>
          <p className="text-xs text-[var(--app-text-secondary)] mt-1">
            Toque em <strong>Compartilhar</strong> e depois <strong>Adicionar à Tela Inicial</strong> para acessar o app rapidamente.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-[var(--app-text-secondary)] hover:text-[var(--app-text)] p-1"
          aria-label="Fechar banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}