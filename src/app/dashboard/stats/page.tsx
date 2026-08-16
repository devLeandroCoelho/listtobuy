'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoMark } from '@/components/LogoMark';
import { ThemeToggle } from '@/components/ThemeToggle';

interface MonthlyStats {
  month: string;
  totalSpent: number;
  totalItems: number;
  listCount: number;
}

interface TopItem {
  name: string;
  count: number;
  totalSpent: number;
}

interface StatsData {
  monthly: MonthlyStats[];
  topItems: TopItem[];
  averagePerList: number;
  currentMonthTotal: number;
  previousMonthTotal: number;
  monthOverMonthChange: number | null;
}

interface CompareItem {
  name: string;
  spentA: number;
  spentB: number;
  difference: number;
  variation: number | null;
}

interface CompareData {
  monthA: string;
  monthB: string;
  totalA: number;
  totalB: number;
  absoluteDifference: number;
  percentageDifference: number | null;
  items: CompareItem[];
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState('');
  const [monthA, setMonthA] = useState('');
  const [monthB, setMonthB] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erro ao carregar estatísticas');
          setLoading(false);
          return;
        }

        setStats(data);

        if (data.monthly.length >= 2) {
          const sorted = [...data.monthly].sort((a, b) => a.month.localeCompare(b.month));
          setMonthA(sorted[sorted.length - 2].month);
          setMonthB(sorted[sorted.length - 1].month);
        } else if (data.monthly.length === 1) {
          setMonthA(data.monthly[0].month);
          setMonthB(data.monthly[0].month);
        }

        setLoading(false);
      } catch {
        setError('Erro de conexão');
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [supabase, router]);

  const handleCompare = async () => {
    if (!monthA || !monthB) {
      setCompareError('Selecione dois meses para comparar');
      return;
    }

    if (monthA === monthB) {
      setCompareError('Selecione meses diferentes para comparar');
      return;
    }

    setComparing(true);
    setCompareError('');
    setCompareData(null);

    try {
      const response = await fetch(`/api/stats/compare?monthA=${monthA}&monthB=${monthB}`);
      const data = await response.json();

      if (!response.ok) {
        setCompareError(data.error || 'Erro ao comparar meses');
        return;
      }

      setCompareData(data);
    } catch {
      setCompareError('Erro de conexão');
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--app-text-secondary)]">Carregando estatísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--app-text-secondary)] mb-4">Nenhuma estatística disponível</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  const maxSpent = Math.max(...stats.monthly.map((m) => m.totalSpent), 1);

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="bg-[var(--app-surface)] border-b border-[var(--app-border)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoMark size={32} variant="icon" />
            <span className="text-xl font-bold text-[var(--app-text)] font-display">ListToBuy</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="px-4 py-2 text-[var(--app-text)] hover:text-[var(--app-accent)] transition-colors"
            >
              ← Voltar
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-[var(--app-text)] mb-8">📊 Histórico de Compras</h1>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-6">
            <p className="text-sm text-[var(--app-text-secondary)] mb-1">Média por lista</p>
            <p className="text-2xl font-bold text-[var(--app-text)]">{formatCurrency(stats.averagePerList)}</p>
          </div>
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-6">
            <p className="text-sm text-[var(--app-text-secondary)] mb-1">Mês atual</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.currentMonthTotal)}</p>
          </div>
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-6">
            <p className="text-sm text-[var(--app-text-secondary)] mb-1">Mês anterior</p>
            <p className="text-2xl font-bold text-[var(--app-text)]">{formatCurrency(stats.previousMonthTotal)}</p>
            {stats.monthOverMonthChange !== null && (
              <p className={`text-sm font-medium mt-1 ${stats.monthOverMonthChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.monthOverMonthChange > 0 ? '↑' : '↓'} {Math.abs(stats.monthOverMonthChange).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Modo Econômico — Comparar gastos */}
        <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-6 mb-8">
          <h2 className="text-lg font-semibold text-[var(--app-text)] mb-4">💰 Modo Econômico</h2>
          <p className="text-sm text-[var(--app-text-secondary)] mb-4">
            Compare gastos entre dois meses e veja onde economizou ou gastou mais.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <label htmlFor="monthA" className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">
                Mês A
              </label>
              <select
                id="monthA"
                value={monthA}
                onChange={(e) => setMonthA(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg text-sm bg-[var(--app-surface)] text-[var(--app-text)] focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
              >
                {stats.monthly.map((m) => (
                  <option key={m.month} value={m.month}>
                    {formatMonth(m.month)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-[var(--app-text-secondary)] text-sm font-medium pb-2">vs</span>
            </div>

            <div className="flex-1">
              <label htmlFor="monthB" className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">
                Mês B
              </label>
              <select
                id="monthB"
                value={monthB}
                onChange={(e) => setMonthB(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--app-border)] rounded-lg text-sm bg-[var(--app-surface)] text-[var(--app-text)] focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
              >
                {stats.monthly.map((m) => (
                  <option key={m.month} value={m.month}>
                    {formatMonth(m.month)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="px-6 py-2 bg-[var(--app-accent)] text-white rounded-xl hover:opacity-90 font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {comparing ? 'Comparando...' : 'Comparar'}
              </button>
            </div>
          </div>

          {compareError && (
            <p className="text-sm text-red-600 mb-4">{compareError}</p>
          )}

          {compareData && (
            <div className="mt-6 fade-in-up">
              {/* Resumo da comparação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--app-muted)] rounded-lg p-4">
                  <p className="text-xs text-[var(--app-text-secondary)] mb-1">Total em {formatMonth(compareData.monthA)}</p>
                  <p className="text-xl font-bold text-[var(--app-text)]">{formatCurrency(compareData.totalA)}</p>
                </div>
                <div className="bg-[var(--app-muted)] rounded-lg p-4">
                  <p className="text-xs text-[var(--app-text-secondary)] mb-1">Total em {formatMonth(compareData.monthB)}</p>
                  <p className="text-xl font-bold text-[var(--app-text)]">{formatCurrency(compareData.totalB)}</p>
                </div>
                <div className={`rounded-lg p-4 ${compareData.absoluteDifference <= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="text-xs text-[var(--app-text-secondary)] mb-1">Diferença</p>
                  <p className={`text-xl font-bold ${compareData.absoluteDifference <= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {compareData.absoluteDifference > 0 ? '+' : ''}{formatCurrency(compareData.absoluteDifference)}
                  </p>
                  {compareData.percentageDifference !== null && (
                    <p className={`text-sm font-medium mt-1 ${compareData.percentageDifference <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {compareData.percentageDifference > 0 ? '↑' : '↓'} {Math.abs(compareData.percentageDifference).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Economizou vs Gastou mais */}
              {compareData.percentageDifference !== null && compareData.percentageDifference > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-red-800">
                    🔴 Você gastou <strong>{Math.abs(compareData.percentageDifference).toFixed(1)}%</strong> a mais em {formatMonth(compareData.monthB)} comparado a {formatMonth(compareData.monthA)}.
                  </p>
                </div>
              )}
              {compareData.percentageDifference !== null && compareData.percentageDifference < 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-green-800">
                    🟢 Você economizou <strong>{Math.abs(compareData.percentageDifference).toFixed(1)}%</strong> em {formatMonth(compareData.monthB)} comparado a {formatMonth(compareData.monthA)}.
                  </p>
                </div>
              )}

              {/* Detalhamento por item */}
              {compareData.items.length > 0 && (
                <div className="border border-[var(--app-border)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--app-muted)] px-4 py-3 border-b border-[var(--app-border)]">
                    <h3 className="text-sm font-semibold text-[var(--app-text)]">Detalhamento por item</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {compareData.items.map((item) => (
                      <div key={item.name} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--app-text)] truncate flex-1">{item.name}</span>
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          <div className="text-right">
                            <p className="text-xs text-[var(--app-text-secondary)]">{formatMonth(compareData.monthA)}</p>
                            <p className="text-sm font-semibold text-[var(--app-text)]">{formatCurrency(item.spentA)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[var(--app-text-secondary)]">{formatMonth(compareData.monthB)}</p>
                            <p className="text-sm font-semibold text-[var(--app-text)]">{formatCurrency(item.spentB)}</p>
                          </div>
                          <div className={`text-right min-w-[80px] ${item.difference > 0 ? 'text-red-600' : item.difference < 0 ? 'text-green-600' : 'text-[var(--app-text-secondary)]'}`}>
                            <p className="text-xs font-medium">
                              {item.difference > 0 ? '↑' : item.difference < 0 ? '↓' : '='} {formatCurrency(Math.abs(item.difference))}
                            </p>
                            {item.variation !== null && (
                              <p className="text-xs">
                                {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gráfico de gastos por mês */}
        {stats.monthly.length > 0 && (
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-6 mb-8">
            <h2 className="text-lg font-semibold text-[var(--app-text)] mb-6">Gastos por mês</h2>
            <div className="space-y-4">
              {stats.monthly.map((m) => {
                const percent = (m.totalSpent / maxSpent) * 100;
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--app-text)]">{formatMonth(m.month)}</span>
                      <span className="text-sm font-semibold text-[var(--app-text-secondary)]">{formatCurrency(m.totalSpent)}</span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-[var(--app-accent)] rounded-lg transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[var(--app-text-secondary)]">
                      <span>{m.listCount} lista{m.listCount !== 1 ? 's' : ''}</span>
                      <span>{m.totalItems} item{m.totalItems !== 1 ? 's' : ''} comprado{m.totalItems !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itens mais comprados */}
        {stats.topItems.length > 0 && (
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--app-text)] mb-4">Itens mais comprados</h2>
            <div className="space-y-3">
              {stats.topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[var(--app-text-secondary)] w-6">{index + 1}º</span>
                    <span className="text-base font-medium text-[var(--app-text)]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[var(--app-text-secondary)]">{item.count}x</span>
                    <span className="text-sm text-[var(--app-text-secondary)] ml-2">{formatCurrency(item.totalSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.monthly.length === 0 && stats.topItems.length === 0 && (
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-[var(--app-text-secondary)]">
              Marque itens como comprados e registre preços para ver estatísticas aqui.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
