export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'hortifruti',
    name: 'Hortifrúti',
    icon: '🥬',
    keywords: [
      'maçã', 'banana', 'laranja', 'limão', 'uva', 'tomate', 'cebola', 'alho',
      'batata', 'cenoura', 'alface', 'rúcula', 'espinafre', 'cheiro verde',
      'salsa', 'coentro', 'mamão', 'melancia', 'melão', 'morango', 'abacate',
      'abobrinha', 'chuchu', 'pimentão', 'mandioca', 'fruta', 'verdura', 'legume'
    ],
  },
  {
    id: 'laticinios',
    name: 'Laticínios & Frios',
    icon: '🧀',
    keywords: [
      'leite', 'queijo', 'presunto', 'manteiga', 'requeijão', 'iogurte',
      'mussarela', 'muçarela', 'prato', 'ricota', 'parmesão', 'margarina',
      'creme de leite', 'leite condensado', 'queijo ralado', 'salame', 'peito de peru'
    ],
  },
  {
    id: 'carnes',
    name: 'Carnes & Açougue',
    icon: '🥩',
    keywords: [
      'carne', 'frango', 'peixe', 'linguiça', 'bacon', 'bife', 'alcatra',
      'contra filé', 'picanha', 'moída', 'coxa', 'sobrecoxa', 'filé de frango',
      'bisteca', 'costela', 'camarão', 'salmão', 'tilápia', 'salsicha', 'hambúrguer'
    ],
  },
  {
    id: 'padaria',
    name: 'Padaria & Confeitaria',
    icon: '🍞',
    keywords: [
      'pão', 'pao', 'torrada', 'bolo', 'croissant', 'bisnaguinha', 'pão de açúcar',
      'pão de forma', 'pão francês', 'torta', 'sonho', 'pão de queijo'
    ],
  },
  {
    id: 'mercearia',
    name: 'Mercearia & Grãos',
    icon: '🥫',
    keywords: [
      'arroz', 'feijão', 'feijao', 'macarrão', 'macarrao', 'óleo', 'oleo',
      'azeite', 'açúcar', 'acucar', 'sal', 'café', 'cafe', 'farinha',
      'fubá', 'molho', 'extrato', 'milho', 'ervilha', 'sardinha', 'atum',
      'biscoito', 'bolacha', 'chocolate', 'achocolatado', 'tempero', 'vinagre'
    ],
  },
  {
    id: 'limpeza',
    name: 'Limpeza',
    icon: '🧹',
    keywords: [
      'detergente', 'sabão', 'sabao', 'amaciante', 'desinfetante', 'agua sanitaria',
      'água sanitária', 'esponja', 'palha de aço', 'multiuso', 'veja', 'lustra móveis',
      'saco de lixo', 'papel toalha', 'lisoform', 'cloro', 'inseticida'
    ],
  },
  {
    id: 'higiene',
    name: 'Higiene & Perfumaria',
    icon: '🧴',
    keywords: [
      'papel higiênico', 'papel higienico', 'sabonete', 'shampoo', 'xampu',
      'condicionador', 'pasta de dente', 'creme dental', 'escova de dente',
      'desodorante', 'fio dental', 'algodão', 'absorvente', 'lâmina', 'barbeador'
    ],
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: '🥤',
    keywords: [
      'água', 'agua', 'refrigerante', 'coca', 'guaraná', 'suco', 'cerveja',
      'vinho', 'vodka', 'whisky', 'energético', 'energetico', 'chá', 'cha'
    ],
  },
  {
    id: 'outros',
    name: 'Outros',
    icon: '📦',
    keywords: [],
  },
];

/** Divide o nome em tokens (palavras), ignorando acentos para o match. */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Verifica se a sequência `seq` aparece contígua em `tokens`. */
function containsSequence(tokens: string[], seq: string[]): boolean {
  for (let i = 0; i <= tokens.length - seq.length; i += 1) {
    let match = true;
    for (let j = 0; j < seq.length; j += 1) {
      if (tokens[i + j] !== seq[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Tenta adivinhar a categoria pelo nome do item.
 *
 * Matching por PALAVRA INTEIRA (token), não por substring: evita falsos
 * positivos como 'salsa' ⊂ 'salsicha' (item de Carnes caindo em Hortifrúti)
 * ou 'sal' ⊂ 'salame'/'salmão'. Acentos são ignorados ('pão' e 'pao' casam).
 */
export function guessCategoryByName(itemName: string): string {
  const tokens = tokenize(itemName);
  if (tokens.length === 0) return 'outros';

  for (const cat of CATEGORIES) {
    if (cat.id === 'outros') continue;
    for (const kw of cat.keywords) {
      const kwTokens = tokenize(kw);
      if (kwTokens.length === 0) continue;

      if (kwTokens.length === 1) {
        if (tokens.includes(kwTokens[0])) return cat.id;
      } else if (containsSequence(tokens, kwTokens)) {
        return cat.id;
      }
    }
  }

  return 'outros';
}

/** Retorna a configuração de uma categoria pelo ID */
export function getCategoryById(id?: string): CategoryConfig {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
