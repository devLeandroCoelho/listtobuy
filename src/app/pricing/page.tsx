'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoMark } from '@/components/LogoMark';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PricingPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, name, email, is_premium')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
          });
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [supabase]);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSubscribing(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar assinatura');
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      {/* Header */}
      <header className="bg-[var(--app-surface)] border-b border-[var(--app-border)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={32} variant="icon" />
            <span className="text-xl font-bold text-[var(--app-text)] font-display">ListToBuy</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-[var(--app-text)] hover:text-[var(--app-accent)] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[var(--app-text)] hover:text-[var(--app-accent)] transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl hover:opacity-90 font-medium shadow-sm transition-colors"
                >
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)] mb-4 font-display">
            Planos e Preços
          </h1>
          <p className="text-lg text-[var(--app-text-secondary)] max-w-2xl mx-auto">
            Escolha o plano ideal para você. Comece grátis e evolua quando precisar.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Plan */}
          <article className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-8">
            <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Grátis</h3>
            <div className="text-4xl font-bold mb-4 text-[var(--app-text)]">R$ 0</div>
            <p className="text-[var(--app-text-secondary)] text-sm mb-6">Para começar sem custo</p>
            <ul className="space-y-3 text-[var(--app-text-secondary)] mb-8" aria-label="Recursos do plano Grátis">
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Até 3 listas por mês
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Controle de orçamento
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Histórico de preços
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Compartilhamento básico
              </li>
            </ul>
            <Link
              href={user ? '/dashboard' : '/register'}
              className="block text-center py-2.5 border border-[var(--app-border)] text-[var(--app-text)] rounded-xl hover:bg-[var(--app-muted)] font-medium transition-colors"
            >
              {user ? 'Voltar para o Dashboard' : 'Começar Grátis'}
            </Link>
          </article>

          {/* Premium Plan */}
          <article className="bg-[var(--app-surface)] border-2 border-[var(--app-accent)] rounded-xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--app-accent)] text-white px-3 py-1 rounded-full text-sm">
              Popular
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Premium</h3>
            <div className="text-4xl font-bold mb-4 text-[var(--app-text)]">
              R$ 29,90
              <span className="text-lg font-normal text-[var(--app-text-secondary)]">/ano</span>
            </div>
            <p className="text-[var(--app-text-secondary)] text-sm mb-6">Para famílias que querem mais</p>
            <ul className="space-y-3 text-[var(--app-text-secondary)] mb-8" aria-label="Recursos do plano Premium">
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Listas ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Tudo do plano Grátis
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Compartilhamento familiar
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--app-success)]">✓</span>
                Suporte prioritário
              </li>
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full py-2.5 bg-[var(--app-accent)] text-white rounded-xl hover:opacity-90 font-medium transition-colors disabled:opacity-50"
            >
              {subscribing ? 'Processando...' : 'Assinar Premium'}
            </button>
          </article>
        </div>

        <div className="text-center mt-12">
          <p className="text-[var(--app-text-secondary)] text-sm">
            Pagamento seguro processado pelo Stripe. Cancele quando quiser.
          </p>
        </div>
      </main>
    </div>
  );
}
