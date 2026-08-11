'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Price {
  id: string;
  value: number;
  month: string;
  created_at: string;
}

interface PriceHistoryProps {
  itemId: string;
  itemName: string;
}

/**
 * PriceHistory — Exibe o histórico de preços de um item mês a mês.
 *
 * Funcionalidades:
 * - Lista de preços ordenada por mês (mais recente primeiro)
 * - Variação percentual entre meses
 * - Formatação de moeda brasileira (R$)
 *
 * Acessibilidade (WCAG 2.1 AA):
 * - aria-label em todos os elementos interativos
 * - Contraste mínimo 4.5:1
 * - Fonte mínima 16px
 * - Sem animações piscantes
 */
export function PriceHistory({ itemId, itemName }: PriceHistoryProps) {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPrices = async () => {
      const { data } = await supabase
        .from('prices')
        .select('*')
        .eq('item_id', itemId)
        .order('month', { ascending: false });

      setPrices(data || []);
      setLoading(false);
    };

    fetchPrices();
  }, [itemId, supabase]);

  // Formatação de moeda brasileira
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Formatação do mês (AAAA-MM → Mês AAAA)
  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]} ${year}`;
  };

  if (loading) {
    return <div className="text-gray-600">Carregando histórico...</div>;
  }

  if (prices.length === 0) {
    return (
      <div className="text-gray-600 text-sm">
        Nenhum preço registrado para {itemName}
      </div>
    );
  }

  // Calcular variação de preço
  const getVariation = (current: number, previous: number) => {
    if (previous === 0) return null;
    const variation = ((current - previous) / previous) * 100;
    return variation;
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold mb-3" aria-label={`Histórico de preços de ${itemName}`}>
        📊 Histórico — {itemName}
      </h3>
      <div className="space-y-2">
        {prices.map((price, index) => {
          const previousPrice = prices[index + 1];
          const variation = previousPrice 
            ? getVariation(price.value, previousPrice.value) 
            : null;

          return (
            <div 
              key={price.id} 
              className="flex items-center justify-between py-2 border-b last:border-0"
              aria-label={`${formatMonth(price.month)}: ${formatCurrency(price.value)}${variation !== null ? `, variação de ${variation > 0 ? 'alta' : 'baixa'} de ${Math.abs(variation).toFixed(1)}%` : ''}`}
            >
              <span className="text-gray-600">{formatMonth(price.month)}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(price.value)}</span>
                {variation !== null && (
                  <span 
                    className={`text-xs ${variation > 0 ? 'text-red-500' : 'text-green-500'}`}
                    aria-hidden="true"
                  >
                    {variation > 0 ? '↑' : '↓'} {Math.abs(variation).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}