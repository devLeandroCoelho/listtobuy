import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between" aria-label="Navegação principal">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🛒</span>
            <span className="text-xl font-bold text-gray-900">ListToBuy</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              aria-label="Entrar na sua conta"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              aria-label="Criar conta gratuita"
            >
              Começar Grátis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Lista de compras{' '}
            <span className="text-blue-600">inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Controle seu orçamento, compare preços mês a mês e economize
            no mercado. Simples, rápido e gratuito.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
              aria-label="Criar sua lista de compras"
            >
              Criar Minha Lista
            </Link>
            <Link
              href="#como-funciona"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-lg"
              aria-label="Saiba como funciona o ListToBuy"
            >
              Como Funciona
            </Link>
          </div>
        </div>

        {/* Features */}
        <section className="mt-24 grid md:grid-cols-3 gap-8" aria-label="Funcionalidades principais">
          <article className="text-center p-6">
            <div className="text-4xl mb-4" aria-hidden="true">💰</div>
            <h3 className="text-xl font-semibold mb-2">Controle de Orçamento</h3>
            <p className="text-gray-600">
              Defina um orçamento mensal e acompanhe quanto já gastou
              e quanto ainda pode gastar.
            </p>
          </article>
          <article className="text-center p-6">
            <div className="text-4xl mb-4" aria-hidden="true">📈</div>
            <h3 className="text-xl font-semibold mb-2">Histórico de Preços</h3>
            <p className="text-gray-600">
              Veja como os preços dos itens mudam mês a mês e
              planeje suas compras.
            </p>
          </article>
          <article className="text-center p-6">
            <div className="text-4xl mb-4" aria-hidden="true">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold mb-2">Compartilhe</h3>
            <p className="text-gray-600">
              Compartilhe a lista com familiares e todos acompanham
              em tempo real.
            </p>
          </article>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <article className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                1
              </div>
              <h4 className="font-semibold mb-2">Crie sua conta</h4>
              <p className="text-gray-600 text-sm">Grátis, sem cartão</p>
            </article>
            <article className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                2
              </div>
              <h4 className="font-semibold mb-2">Crie uma lista</h4>
              <p className="text-gray-600 text-sm">Defina orçamento e mês</p>
            </article>
            <article className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                3
              </div>
              <h4 className="font-semibold mb-2">Adicione itens</h4>
              <p className="text-gray-600 text-sm">Digite e registre preços</p>
            </article>
            <article className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" aria-hidden="true">
                4
              </div>
              <h4 className="font-semibold mb-2">Acompanhe</h4>
              <p className="text-gray-600 text-sm">Veja seus gastos em tempo real</p>
            </article>
          </div>
        </section>

        {/* Pricing */}
        <section className="mt-24" aria-label="Planos e preços">
          <h2 className="text-3xl font-bold text-center mb-12">Planos</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <article className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-2">Grátis</h3>
              <div className="text-4xl font-bold mb-4">R$ 0</div>
              <ul className="space-y-2 text-gray-600 mb-6" aria-label="Recursos do plano Grátis">
                <li>✅ 1-2 listas</li>
                <li>✅ Controle de orçamento</li>
                <li>✅ Histórico de preços</li>
                <li>✅ Compartilhamento</li>
              </ul>
              <Link
                href="/register"
                className="block text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                aria-label="Começar com plano Grátis"
              >
                Começar Grátis
              </Link>
            </article>
            <article className="border-2 border-blue-600 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-4">
                R$ 29,90<span className="text-lg font-normal">/ano</span>
              </div>
              <ul className="space-y-2 text-gray-600 mb-6" aria-label="Recursos do plano Premium">
                <li>✅ Listas ilimitadas</li>
                <li>✅ Tudo do plano Grátis</li>
                <li>✅ Família ilimitada</li>
                <li>✅ Suporte prioritário</li>
              </ul>
              <Link
                href="/register?plan=premium"
                className="block text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                aria-label="Assinar plano Premium"
              >
                Assinar Premium
              </Link>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🛒</span>
              <span className="font-semibold">ListToBuy</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2026 ListToBuy. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
