'use client';

import React from 'react';

interface LogoMarkProps {
  size?: number;
  variant?: 'full' | 'icon';
  className?: string;
}

export function LogoMark({ size = 120, variant = 'full', className = '' }: LogoMarkProps) {
  const iconSize = Math.max(24, Math.min(size, 120));
  const isFull = variant === 'full';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={isFull ? iconSize : iconSize}
        height={isFull ? iconSize : iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Fundo: quadrado arredondado Ink Navy */}
        <rect width="120" height="120" rx="24" fill="#0B1E2F" />
        {/* Checkmark Marker Orange, inclinado -12deg */}
        <g transform="translate(60, 60) rotate(-12) translate(-32, -14)">
          <path
            d="M12 48L52 8L62 18L22 58L2 38L12 28L22 38L52 8"
            stroke="#E85D04"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
      {isFull && (
        <span className="font-display text-xl font-bold tracking-tight text-ink-navy">
          ListToBuy
        </span>
      )}
    </span>
  );
}