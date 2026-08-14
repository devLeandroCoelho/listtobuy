'use client';

import Link from 'next/link';
import { LogoMark } from '@/components/LogoMark';

export default function Home() {
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
            <Link
              href="/login"
              className="px-4 py-2 text-[var(--app-text)] hover:text-[var(--app-accent)] transition-colors"
              aria-label="Entrar na sua conta"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl hover:opacity-90 font-medium shadow-sm transition-colors"
              aria-label="Criar conta gratuita"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--app-text)] mb-6 font-display">
              Liste. Marque. Economize.
            </h1>
            <p className="text-lg sm:text-xl text-[var(--app-text-secondary)] mb-8">
              Chega de esquecer itens ou estourar o orçamento no mercado. O ListToBuy transforma sua lista em um planejamento inteligente, mês a mês.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-xl hover:opacity-90 text-lg font-medium shadow-sm transition-colors"
                aria-label="Criar sua lista de compras"
              >
                Criar Minha Lista
              </Link>
              <Link
                href="#como-funciona"
                className="px-8 py-3 border border-[var(--app-border)] text-[var(--app-text)] rounded-xl hover:bg-[var(--app-muted)] text-lg font-medium transition-colors"
                aria-label="Saiba como funciona o ListToBuy"
              >
                Como Funciona
              </Link>
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="bg-[var(--app-muted)] py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--app-text)] mb-6 font-display">
              Você já passou por isso?
            </h2>
            <p className="text-center text-[var(--app-text-secondary)] mb-12 text-lg">
              Esqueceu o leite no mercado? Descobriu no final do mês que o orçamento estourou? Comprou o mesmo produto por preços diferentes sem perceber?
            </p>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4" aria-hidden="true">📝</div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Lista no papel some</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Papel se perde, caneta falha. Quando você precisa da lista, ela não está onde deveria.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4" aria-hidden="true">💸</div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Orçamento vira chute</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Sem controle, você nunca sabe quanto já gastou até o caixa passar o cartão.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4" aria-hidden="true">📈</div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Preço some da memória</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Você não lembra se o feijão estava R$ 8,90 ou R$ 9,50 mês passado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solução */}
        <section id="como-funciona" className="container mx-auto px-4 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--app-text)] mb-4 font-display">
            O ListToBuy resolve isso
          </h2>
          <p className="text-center text-[var(--app-text-secondary)] mb-12 max-w-2xl mx-auto">
            Não é só uma lista. É um planejamento de compras que acompanha seu orçamento, registra preços e lembra de tudo para você.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--app-accent)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                1
              </div>
              <h4 className="font-semibold mb-2 text-[var(--app-text)]">Crie sua conta</h4>
              <p className="text-[var(--app-text-secondary)] text-sm">Grátis, sem cartão, em 30 segundos.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--app-accent)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                2
              </div>
              <h4 className="font-semibold mb-2 text-[var(--app-text)]">Crie uma lista</h4>
              <p className="text-[var(--app-text-secondary)] text-sm">Defina o mês e o orçamento total.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--app-accent)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                3
              </div>
              <h4 className="font-semibold mb-2 text-[var(--app-text)]">Adicione itens</h4>
              <p className="text-[var(--app-text-secondary)] text-sm">Digite, marque comprado e registre o preço.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--app-accent)] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                4
              </div>
              <h4 className="font-semibold mb-2 text-[var(--app-text)]">Acompanhe</h4>
              <p className="text-[var(--app-text-secondary)] text-sm">Veja seus gastos em tempo real e compare com meses anteriores.</p>
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="bg-[var(--app-muted)] py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--app-text)] mb-12 font-display">
              Funcionalidades
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-[var(--app-surface)] p-6 rounded-xl border border-[var(--app-border)]">
                <div className="text-3xl mb-4" aria-hidden="true">💰</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--app-text)]">Controle de Orçamento</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Defina um orçamento mensal e acompanhe quanto já gastou e quanto ainda pode gastar.
                </p>
              </div>
              <div className="bg-[var(--app-surface)] p-6 rounded-xl border border-[var(--app-border)]">
                <div className="text-3xl mb-4" aria-hidden="true">📈</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--app-text)]">Histórico de Preços</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Veja como os preços dos itens mudam mês a mês e planeje suas compras.
                </p>
              </div>
              <div className="bg-[var(--app-surface)] p-6 rounded-xl border border-[var(--app-border)]">
                <div className="text-3xl mb-4" aria-hidden="true">👨‍👩‍👧‍👦</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--app-text)]">Compartilhamento</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Compartilhe a lista com familiares e todos acompanham em tempo real.
                </p>
              </div>
              <div className="bg-[var(--app-surface)] p-6 rounded-xl border border-[var(--app-border)]">
                <div className="text-3xl mb-4" aria-hidden="true">🏷️</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--app-text)]">Categorias</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Organize itens por seção do mercado para uma compra mais rápida.
                </p>
              </div>
              <div className="bg-[var(--app-surface)] p-6 rounded-xl border border-[var(--app-border)]">
                <div className="text-3xl mb-4" aria-hidden="true">📊</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--app-text)]">Relatórios</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Acompanhe o progresso da compra e veja estatísticas do seu consumo.
                </p>
              </div>
              <div className="bg-[var(--app-surface)] p-6 rounded-xl border border-[var(--app-border)]">
                <div className="text-3xl mb-4" aria-hidden="true">📱</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--app-text)]">100% Web</h3>
                <p className="text-[var(--app-text-secondary)]">
                  Funciona no celular e desktop, sem precisar instalar nada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preço */}
        <section className="container mx-auto px-4 py-16 sm:py-24" aria-label="Planos e preços">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--app-text)] mb-12 font-display">
            Planos
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <article className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Grátis</h3>
              <div className="text-4xl font-bold mb-4 text-[var(--app-text)]">R$ 0</div>
              <ul className="space-y-2 text-[var(--app-text-secondary)] mb-6" aria-label="Recursos do plano Grátis">
                <li>✅ 1-2 listas</li>
                <li>✅ Controle de orçamento</li>
                <li>✅ Histórico de preços</li>
                <li>✅ Compartilhamento</li>
              </ul>
              <Link
                href="/register"
                className="block text-center py-2 border border-[var(--app-border)] text-[var(--app-text)] rounded-xl hover:bg-[var(--app-muted)] font-medium transition-colors"
                aria-label="Começar com plano Grátis"
              >
                Começar Grátis
              </Link>
            </article>
            <article className="bg-[var(--app-surface)] border-2 border-[var(--app-accent)] rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--app-accent)] text-white px-3 py-1 rounded-full text-sm">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">Premium</h3>
              <div className="text-4xl font-bold mb-4 text-[var(--app-text)]">
                R$ 29,90<span className="text-lg font-normal text-[var(--app-text-secondary)]">/ano</span>
              </div>
              <ul className="space-y-2 text-[var(--app-text-secondary)] mb-6" aria-label="Recursos do plano Premium">
                <li>✅ Listas ilimitadas</li>
                <li>✅ Tudo do plano Grátis</li>
                <li>✅ Família ilimitada</li>
                <li>✅ Suporte prioritário</li>
              </ul>
              <Link
                href="/register?plan=premium"
                className="block text-center py-2 bg-[var(--app-accent)] text-white rounded-xl hover:opacity-90 font-medium transition-colors"
                aria-label="Assinar plano Premium"
              >
                Assinar Premium
              </Link>
            </article>
          </div>
        </section>

        {/* CTA Final */}
        <section className="bg-[var(--app-accent)] py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 font-display">
              Pronto para parar de estourar o orçamento?
            </h2>
            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Crie sua primeira lista em 30 segundos. Grátis, sem cartão, sem enrolação.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-white text-[var(--app-accent)] rounded-xl hover:bg-gray-100 text-lg font-medium shadow-sm transition-colors"
              aria-label="Criar conta gratuita agora"
            >
              Começar Grátis Agora
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--app-surface)] border-t border-[var(--app-border)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark size={24} variant="icon" />
              <span className="font-semibold text-[var(--app-text)]">ListToBuy</span>
            </Link>
            <p className="text-[var(--app-text-secondary)] text-sm">
              © 2026 ListToBuy. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}