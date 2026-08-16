'use client';

import { getCategoryById, CATEGORIES } from '@/lib/categories';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hortifruti: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  laticinios: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  carnes: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  padaria: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  mercearia: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  limpeza: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  higiene: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  bebidas: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  outros: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

interface CategoryChipProps {
  categoryId?: string | null;
  className?: string;
}

export function CategoryChip({ categoryId, className = '' }: CategoryChipProps) {
  if (!categoryId) return null;

  const category = getCategoryById(categoryId);
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.outros;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
      aria-label={`Categoria: ${category.name}`}
    >
      <span aria-hidden="true">{category.icon}</span>
      <span>{category.name}</span>
    </span>
  );
}
