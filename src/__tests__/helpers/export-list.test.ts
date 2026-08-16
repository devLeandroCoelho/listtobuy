import { describe, expect, it, vi } from 'vitest';
import { generateCSV, generatePDFHTML, printPDF, downloadCSV } from '@/lib/export-list';
import type { ListData, ItemData } from '@/lib/export-list';

const mockList: ListData = {
  id: '1',
  name: 'Mercado Semanal',
  month: '2026-08',
  budget: '500',
};

const mockItems: ItemData[] = [
  { id: '1', list_id: '1', name: 'Arroz', quantity: '2', unit: 'kg', completed: '0', price: null, category: 'mercearia' },
  { id: '2', list_id: '1', name: 'Leite', quantity: '1', unit: 'un', completed: '1', price: 5.5, category: 'laticinios' },
  { id: '3', list_id: '1', name: 'Pão', quantity: '1', unit: 'pct', completed: '1', price: '8,90', category: 'padaria' },
];

describe('generateCSV', () => {
  it('gera CSV com cabeçalhos corretos', () => {
    const csv = generateCSV(mockList, mockItems, 'all');
    expect(csv.includes('nome;quantidade;unidade;preço;categoria;status')).toBe(true);
  });

  it('inclui todos os itens quando scope é all', () => {
    const csv = generateCSV(mockList, mockItems, 'all');
    const lines = csv.split('\n');
    expect(lines.length).toBe(4); // header + 3 items
    expect(csv.includes('Arroz')).toBe(true);
    expect(csv.includes('Leite')).toBe(true);
    expect(csv.includes('Pão')).toBe(true);
  });

  it('filtra apenas pendentes quando scope é pending', () => {
    const csv = generateCSV(mockList, mockItems, 'pending');
    const lines = csv.split('\n');
    expect(lines.length).toBe(2); // header + 1 pending item
    expect(csv.includes('Arroz')).toBe(true);
    expect(csv.includes('Leite')).toBe(false);
    expect(csv.includes('Pão')).toBe(false);
  });

  it('escapa vírgulas e aspas nos valores', () => {
    const itemsWithSpecialChars: ItemData[] = [
      { id: '1', list_id: '1', name: 'Café "extra"', quantity: '1', unit: 'un', completed: '0', price: null, category: 'mercearia' },
    ];
    const csv = generateCSV(mockList, itemsWithSpecialChars, 'all');
    expect(csv).toContain('"Café ""extra"""');
  });

  it('formata preços em BRL corretamente', () => {
    const csv = generateCSV(mockList, mockItems, 'all');
    expect(csv).toContain('R$ 5,50');
    expect(csv).toContain('R$ 8,90');
  });

  it('formata categorias corretamente', () => {
    const csv = generateCSV(mockList, mockItems, 'all');
    expect(csv).toContain('Mercearia & Grãos');
    expect(csv).toContain('Laticínios & Frios');
    expect(csv).toContain('Padaria & Confeitaria');
  });

  it('mostra status correto', () => {
    const csv = generateCSV(mockList, mockItems, 'all');
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Pendente');
    expect(lines[2]).toContain('Comprado');
    expect(lines[3]).toContain('Comprado');
  });
});

describe('generatePDFHTML', () => {
  it('gera HTML válido com nome e mês da lista', () => {
    const html = generatePDFHTML(mockList, mockItems, 'all');
    expect(html).toContain('<title>Mercado Semanal - agosto de 2026</title>');
    expect(html).toContain('<h1>Mercado Semanal</h1>');
    expect(html).toContain('agosto de 2026');
  });

  it('inclui tabela com todos os itens no escopo all', () => {
    const html = generatePDFHTML(mockList, mockItems, 'all');
    expect(html.includes('<td>Arroz</td>')).toBe(true);
    expect(html.includes('<td>Leite</td>')).toBe(true);
    expect(html.includes('<td>Pão</td>')).toBe(true);
  });

  it('filtra pendentes no escopo pending', () => {
    const html = generatePDFHTML(mockList, mockItems, 'pending');
    expect(html.includes('<td>Arroz</td>')).toBe(true);
    expect(html.includes('<td>Leite</td>')).toBe(false);
  });

  it('inclui resumo com gasto e restante', () => {
    const html = generatePDFHTML(mockList, mockItems, 'all');
    expect(html).toContain('Gasto');
    expect(html).toContain('R$ 14,40');
    expect(html).toContain('Restante');
  });

  it('inclui data de geração no rodapé', () => {
    const html = generatePDFHTML(mockList, mockItems, 'all');
    expect(html).toContain('Gerado por ListToBuy');
  });

  it('mostra apenas pendentes no subtítulo quando scope é pending', () => {
    const html = generatePDFHTML(mockList, mockItems, 'pending');
    expect(html).toContain('Apenas pendentes');
  });
});


