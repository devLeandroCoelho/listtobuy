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
        {/* Fundo Paper White com borda sutil Marker Orange */}
        <rect width="120" height="120" rx="24" fill="#FDFCFB" stroke="#E85D04" strokeWidth="5" />
        
        {/* 3 linhas curvas representando itens de lista */}
        <g stroke="#0B1E2F" strokeWidth="7" strokeLinecap="round">
          <path d="M24 36h72" opacity="0.7" />
          <path d="M24 60h52" opacity="0.85" />
          <path d="M24 84h64" opacity="0.7" />
        </g>

        {/* Checkmark Marker Orange no canto inferior direito */}
        <g transform="translate(78, 78)">
          <circle cx="22" cy="22" r="22" fill="#E85D04" />
          <path
            d="M14 22l6 6 12-12"
            stroke="#FDFCFB"
            strokeWidth="6"
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