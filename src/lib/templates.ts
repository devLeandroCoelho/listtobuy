import { CATEGORIES, type CategoryConfig } from '@/lib/categories';

export interface TemplateItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface ListTemplate {
  id: string;
  name: string;
  icon: string;
  items: TemplateItem[];
}

export const LIST_TEMPLATES: ListTemplate[] = [
  {
    id: 'semana',
    name: 'Semana',
    icon: '📅',
    items: [
      { name: 'Arroz', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Feijão', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Pão francês', quantity: 1, unit: 'pct', category: 'padaria' },
      { name: 'Leite', quantity: 2, unit: 'l', category: 'laticinios' },
      { name: 'Ovos', quantity: 1, unit: 'cx', category: 'laticinios' },
      { name: 'Banana', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Tomate', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Cebola', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Alho', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Detergente', quantity: 1, unit: 'un', category: 'limpeza' },
      { name: 'Papel higiênico', quantity: 1, unit: 'pct', category: 'higiene' },
    ],
  },
  {
    id: 'churrasco',
    name: 'Churrasco',
    icon: '🍖',
    items: [
      { name: 'Picanha', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Linguiça toscana', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Pão de alho', quantity: 1, unit: 'pct', category: 'padaria' },
      { name: 'Carvão', quantity: 1, unit: 'pct', category: 'outros' },
      { name: 'Cerveja', quantity: 1, unit: 'cx', category: 'bebidas' },
      { name: 'Refrigerante', quantity: 2, unit: 'l', category: 'bebidas' },
      { name: 'Pão de queijo', quantity: 1, unit: 'pct', category: 'padaria' },
      { name: 'Manteiga', quantity: 1, unit: 'un', category: 'laticinios' },
      { name: 'Sal grosso', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Alface', quantity: 1, unit: 'un', category: 'hortifruti' },
      { name: 'Tomate', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Cebola', quantity: 1, unit: 'kg', category: 'hortifruti' },
    ],
  },
  {
    id: 'aniversario',
    name: 'Aniversário',
    icon: '🎂',
    items: [
      { name: 'Bolo', quantity: 1, unit: 'un', category: 'padaria' },
      { name: 'Refrigerante', quantity: 2, unit: 'l', category: 'bebidas' },
      { name: 'Suco', quantity: 2, unit: 'l', category: 'bebidas' },
      { name: 'Salgadinhos', quantity: 2, unit: 'pct', category: 'padaria' },
      { name: 'Doces', quantity: 1, unit: 'pct', category: 'padaria' },
      { name: 'Balas', quantity: 1, unit: 'pct', category: 'mercearia' },
      { name: 'Copos descartáveis', quantity: 1, unit: 'pct', category: 'outros' },
      { name: 'Pratos descartáveis', quantity: 1, unit: 'pct', category: 'outros' },
      { name: 'Guardanapos', quantity: 1, unit: 'pct', category: 'outros' },
      { name: 'Velas de aniversário', quantity: 1, unit: 'pct', category: 'outros' },
    ],
  },
  {
    id: 'viagem',
    name: 'Viagem',
    icon: '✈️',
    items: [
      { name: 'Água mineral', quantity: 2, unit: 'l', category: 'bebidas' },
      { name: 'Snacks', quantity: 1, unit: 'pct', category: 'mercearia' },
      { name: 'Fruta', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Protetor solar', quantity: 1, unit: 'un', category: 'higiene' },
      { name: 'Repelente', quantity: 1, unit: 'un', category: 'higiene' },
      { name: 'Remédios', quantity: 1, unit: 'un', category: 'higiene' },
      { name: 'Mala', quantity: 1, unit: 'un', category: 'outros' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '💪',
    items: [
      { name: 'Peito de frango', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Ovos', quantity: 1, unit: 'cx', category: 'laticinios' },
      { name: 'Aveia', quantity: 1, unit: 'pct', category: 'mercearia' },
      { name: 'Whey protein', quantity: 1, unit: 'pct', category: 'mercearia' },
      { name: 'Banana', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Batata doce', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Brócolis', quantity: 1, unit: 'un', category: 'hortifruti' },
      { name: 'Arroz integral', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Azeite de oliva', quantity: 1, unit: 'un', category: 'mercearia' },
      { name: 'Iogurte natural', quantity: 1, unit: 'un', category: 'laticinios' },
    ],
  },
];

export function getTemplateById(id: string): ListTemplate | undefined {
  return LIST_TEMPLATES.find((t) => t.id === id);
}
