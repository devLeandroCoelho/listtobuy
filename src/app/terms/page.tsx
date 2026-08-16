import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso | ListToBuy',
  description: 'Termos de Uso do ListToBuy.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)] mb-8 font-display">
          Termos de Uso
        </h1>

        <div className="space-y-8 text-[var(--app-text-secondary)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar o <strong className="text-[var(--app-text)]">ListToBuy</strong>, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis.
              Se você não concordar com estes termos, não utilize o aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">2. Descrição do Serviço</h2>
            <p>
              O ListToBuy é um aplicativo de lista de compras inteligente que permite criar listas, controlar orçamentos, registrar preços e compartilhar listas com familiares.
              O serviço é oferecido nas modalidades Grátis e Premium, conforme descrito na página de planos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">3. Cadastro e Conta</h2>
            <p>
              Para utilizar o ListToBuy, você deve criar uma conta fornecendo informações verdadeiras, precisas e atualizadas.
              Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">4. Condutas Proibidas</h2>
            <p>Você concorda em não:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utilizar o serviço para fins ilegais, fraudulentos ou não autorizados.</li>
              <li>Compartilhar conteúdo ofensivo, difamatório ou que viole direitos de terceiros.</li>
              <li>Tentar acessar áreas restritas do sistema ou contas de outros usuários.</li>
              <li>Interferir no funcionamento normal do aplicativo por meio de scripts, bots ou outras técnicas automatizadas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do ListToBuy, incluindo design, código, marcas e logotipos, é de propriedade do ListToBuy ou de seus licenciadores e está protegido por leis de propriedade intelectual.
              Você mantém a propriedade dos dados que insere no aplicativo (listas, itens, preços).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">6. Privacidade</h2>
            <p>
              A sua privacidade é importante para nós. Consulte nossa <Link href="/privacy" className="underline text-[var(--app-accent)]">Política de Privacidade</Link> para entender como coletamos, usamos e protegemos seus dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">7. Cancelamento e Exclusão</h2>
            <p>
              Você pode cancelar sua conta a qualquer momento por meio das configurações da conta ou solicitando a exclusão pelo e-mail{' '}
              <a href="mailto:contato@listtobuy.com.br" className="underline text-[var(--app-accent)]">
                contato@listtobuy.com.br
              </a>.
              Após o cancelamento, seus dados serão removidos em até 30 dias, salvo retenção obrigatória por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">8. Modificações dos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento.
              Alterações entrarão em vigor imediatamente após a publicação no aplicativo.
              O uso contínuo do serviço após tais modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">9. Lei Aplicável</h2>
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
              Qualquer disputa será resolvida no foro da comarca de Barra Velha/SC, com exclusão de qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <div className="pt-6 border-t border-[var(--app-border)]">
            <Link href="/" className="text-[var(--app-accent)] hover:underline font-medium">
              ← Voltar para o ListToBuy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
