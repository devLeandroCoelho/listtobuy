export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  keywords: string[];
  ingredients: RecipeIngredient[];
}

export const RECIPES: Recipe[] = [
  {
    id: 'bolo-de-chocolate',
    name: 'Bolo de chocolate',
    keywords: ['bolo', 'chocolate', 'bolo de chocolate'],
    ingredients: [
      { name: 'Farinha de trigo', quantity: 2, unit: 'kg', category: 'mercearia' },
      { name: 'Açúcar', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Ovos', quantity: 1, unit: 'cx', category: 'laticinios' },
      { name: 'Leite', quantity: 1, unit: 'l', category: 'laticinios' },
      { name: 'Chocolate em pó', quantity: 1, unit: 'pct', category: 'mercearia' },
      { name: 'Manteiga', quantity: 1, unit: 'un', category: 'laticinios' },
      { name: 'Fermento', quantity: 1, unit: 'un', category: 'mercearia' },
    ],
  },
  {
    id: 'feijoada',
    name: 'Feijoada',
    keywords: ['feijoada', 'feijao'],
    ingredients: [
      { name: 'Feijão preto', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Linguiça toscana', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Paio', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Bacon', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Arroz', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Couve', quantity: 1, unit: 'un', category: 'hortifruti' },
      { name: 'Laranja', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Farofa', quantity: 1, unit: 'pct', category: 'mercearia' },
    ],
  },
  {
    id: 'massa-carbonara',
    name: 'Massa carbonara',
    keywords: ['carbonara', 'massa', 'macarrao', 'espaguete'],
    ingredients: [
      { name: 'Macarrão espaguete', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Ovos', quantity: 1, unit: 'cx', category: 'laticinios' },
      { name: 'Queijo parmesão', quantity: 1, unit: 'un', category: 'laticinios' },
      { name: 'Bacon', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Creme de leite', quantity: 1, unit: 'un', category: 'laticinios' },
    ],
  },
  {
    id: 'strogonoff',
    name: 'Strogonoff',
    keywords: ['strogonoff', 'estrogonofe'],
    ingredients: [
      { name: 'Filé mignon', quantity: 1, unit: 'kg', category: 'carnes' },
      { name: 'Creme de leite', quantity: 1, unit: 'un', category: 'laticinios' },
      { name: 'Molho de tomate', quantity: 1, unit: 'un', category: 'mercearia' },
      { name: 'Arroz', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Batata palha', quantity: 1, unit: 'pct', category: 'mercearia' },
    ],
  },
  {
    id: 'pao-de-queijo',
    name: 'Pão de queijo',
    keywords: ['pão de queijo', 'pao de queijo', 'pãoqueijo'],
    ingredients: [
      { name: 'Polvilho', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Leite', quantity: 1, unit: 'l', category: 'laticinios' },
      { name: 'Ovos', quantity: 1, unit: 'cx', category: 'laticinios' },
      { name: 'Queijo mussarela', quantity: 1, unit: 'kg', category: 'laticinios' },
      { name: 'Óleo', quantity: 1, unit: 'un', category: 'mercearia' },
    ],
  },
  {
    id: 'salada',
    name: 'Salada',
    keywords: ['salada', 'salada mista'],
    ingredients: [
      { name: 'Alface', quantity: 1, unit: 'un', category: 'hortifruti' },
      { name: 'Tomate', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Cebola', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Azeite de oliva', quantity: 1, unit: 'un', category: 'mercearia' },
      { name: 'Limão', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Sal', quantity: 1, unit: 'un', category: 'mercearia' },
    ],
  },
  {
    id: 'suco-de-laranja',
    name: 'Suco de laranja',
    keywords: ['suco', 'suco de laranja', 'suco natural'],
    ingredients: [
      { name: 'Laranja', quantity: 2, unit: 'kg', category: 'hortifruti' },
      { name: 'Açúcar', quantity: 1, unit: 'kg', category: 'mercearia' },
      { name: 'Água', quantity: 1, unit: 'l', category: 'bebidas' },
    ],
  },
  {
    id: 'sanduiche-natural',
    name: 'Sanduíche natural',
    keywords: ['sanduíche', 'sanduiche', 'sanduíche natural'],
    ingredients: [
      { name: 'Pão de forma', quantity: 1, unit: 'pct', category: 'padaria' },
      { name: 'Queijo mussarela', quantity: 1, unit: 'kg', category: 'laticinios' },
      { name: 'Peito de peru', quantity: 1, unit: 'kg', category: 'laticinios' },
      { name: 'Alface', quantity: 1, unit: 'un', category: 'hortifruti' },
      { name: 'Tomate', quantity: 1, unit: 'kg', category: 'hortifruti' },
      { name: 'Manteiga', quantity: 1, unit: 'un', category: 'laticinios' },
    ],
  },
];

export function findRecipesByQuery(query: string): Recipe[] {
  const normalized = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!normalized) return [];

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);

  return RECIPES.filter((recipe) => {
    const recipeNameNorm = recipe.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const recipeTokens = recipeNameNorm.split(/[^a-z0-9]+/).filter(Boolean);

    if (containsSequence(recipeTokens, tokens)) return true;
    return recipe.keywords.some((kw) => {
      const kwNorm = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const kwTokens = kwNorm.split(/[^a-z0-9]+/).filter(Boolean);
      return containsSequence(kwTokens, tokens) || containsSequence(tokens, kwTokens);
    });
  });
}

function containsSequence(source: string[], target: string[]): boolean {
  if (target.length === 0) return true;
  if (source.length === 0) return false;

  for (let i = 0; i <= source.length - target.length; i++) {
    let match = true;
    for (let j = 0; j < target.length; j++) {
      if (source[i + j] !== target[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
