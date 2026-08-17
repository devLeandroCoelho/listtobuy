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
        .order('month', { ascending: true });

      setPrices(data || []);
      setLoading(false);
    };

    fetchPrices();
  }, [itemId, supabase]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

  const values = prices.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 280;
  const height = 120;
  const padding = 24;

  const getX = (index: number) => padding + (index / (values.length - 1)) * (width - padding * 2);
  const getY = (value: number) => height - padding - ((value - min) / range) * (height - padding * 2);

  const pathD = values
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(value)}`)
    .join(' ');

  const areaD = `${pathD} L ${getX(values.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div className="bg-[var(--app-surface)] rounded-xl shadow p-4">
      <h3 className="font-semibold mb-3" aria-label={`Histórico de preços de ${itemName}`}>
        📊 Histórico — {itemName}
      </h3>
      <div className="mb-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-hidden="true">
          <rect x={0} y={0} width={width} height={height} fill="transparent" />
          <path d={areaD} fill="rgba(59,130,246,0.1)" stroke="none" />
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((value, index) => (
            <circle key={index} cx={getX(index)} cy={getY(value)} r="3" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
          ))}
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatMonth(prices[0].month)}</span>
          <span>{formatMonth(prices[prices.length - 1].month)}</span>
        </div>
      </div>
      <div className="space-y-2">
        {prices.map((price, index) => {
          const previousPrice = prices[index + 1];
          const variation = previousPrice ? ((price.value - previousPrice.value) / previousPrice.value) * 100 : null;

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