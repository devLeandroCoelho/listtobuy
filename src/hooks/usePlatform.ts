'use client';

import { useMemo } from 'react';

export function usePlatform() {
  const platform = useMemo<'ios' | 'android' | 'desktop'>(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(userAgent);
    return isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  }, []);

  return platform;
}
