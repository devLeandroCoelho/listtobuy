'use client';

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGesture(options: SwipeHandlers = {}) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = options;
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    if (Math.max(absDiffX, absDiffY) < minSwipeDistance) return;

    if (absDiffX > absDiffY) {
      if (diffX > 0 && onSwipeLeft) onSwipeLeft();
      else if (diffX < 0 && onSwipeRight) onSwipeRight();
    } else {
      if (diffY > 0 && onSwipeUp) onSwipeUp();
      else if (diffY < 0 && onSwipeDown) onSwipeDown();
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
