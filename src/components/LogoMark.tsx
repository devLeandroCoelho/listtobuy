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
        {/* Fundo Paper White com borda Marker Orange */}
        <rect width="120" height="120" rx="28" fill="#FDFCFB" stroke="#E85D04" strokeWidth="6" />
        
        {/* ClipPaper com sombra sutil */}
        <rect x="18" y="18" width="84" height="84" rx="16" fill="#FFFFFF" stroke="#0B1E2F" strokeWidth="3" />
        
        {/* Linhas de lista estilo caneta (Pencil Navy) */}
        <g stroke="#0B1E2F" strokeWidth="6" strokeLinecap="round">
          <path d="M28 40h64" opacity="0.95" />
          <path d="M28 58h48" opacity="0.9" />
          <path d="M28 76h56" opacity="0.85" />
        </g>

        {/* Checkmark Marker Orange com destaque */}
        <g transform="translate(72, 72)">
          <circle cx="24" cy="24" r="24" fill="#E85D04" />
          <circle cx="24" cy="24" r="24" fill="url(#logoGradient)" />
          <path
            d="M14 24l7 7 14-14"
            stroke="#FDFCFB"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F48C06" />
            <stop offset="1" stopColor="#E85D04" />
          </linearGradient>
        </defs>
      </svg>
      {isFull && (
        <span className="font-display text-xl font-bold tracking-tight text-ink-navy">
          ListToBuy
        </span>
      )}
    </span>
  );
}