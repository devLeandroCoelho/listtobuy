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
      'batata', 'cenoura', 'alface', 'rúcula', 'espinhafre', 'cheiro verde',
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

/** Tenta adivinhar a categoria pelo nome do item */
export function guessCategoryByName(itemName: string): string {
  const cleanName = itemName.toLowerCase().trim();
  if (!cleanName) return 'outros';

  for (const cat of CATEGORIES) {
    if (cat.id === 'outros') continue;
    for (const kw of cat.keywords) {
      if (cleanName.includes(kw)) {
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
