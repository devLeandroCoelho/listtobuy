'use client';

import { useState, useEffect } from 'react';

export function usePlatform() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(userAgent);
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');
  }, []);

  return platform;
}
