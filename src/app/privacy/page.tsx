import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | ListToBuy',
  description: 'Política de Privacidade do ListToBuy em conformidade com a LGPD.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--app-text)] mb-8 font-display">
          Política de Privacidade
        </h1>

        <div className="space-y-8 text-[var(--app-text-secondary)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como o <strong className="text-[var(--app-text)]">ListToBuy</strong> (&quot;nós&quot;, &quot;nosso&quot; ou &quot;aplicativo&quot;) coleta, usa, armazena e protege os dados pessoais dos usuários (&quot;você&quot; ou &quot;titular&quot;), em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">2. Dados Coletados</h2>
            <p>Coletamos apenas os dados necessários para o funcionamento do serviço:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-[var(--app-text)]">Dados de cadastro:</strong> nome e e-mail, fornecidos no momento do registro.</li>
              <li><strong className="text-[var(--app-text)]">Dados de autenticação:</strong> token de sessão gerenciado pelo Supabase Auth.</li>
              <li><strong className="text-[var(--app-text)]">Dados de uso:</strong> listas de compras, itens, orçamentos, preços registrados e histórico de preços.</li>
              <li><strong className="text-[var(--app-text)]">Dados técnicos:</strong> endereço IP, tipo de navegador e preferência de tema (claro/escuro), armazenados localmente no seu dispositivo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">3. Finalidade do Tratamento</h2>
            <p>Seus dados são tratados para as seguintes finalidades:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer e manter o funcionamento do serviço (criação de listas, registro de preços, compartilhamento).</li>
              <li>Autenticar você e garantir a segurança da sua conta.</li>
              <li>Melhorar a experiência do usuário e desenvolver novas funcionalidades.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">4. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros do <strong className="text-[var(--app-text)]">Supabase</strong> (PostgreSQL com RLS — Row Level Security), o que garante que apenas você possa acessar suas listas e itens.
              Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">5. Compartilhamento de Dados</h2>
            <p>
              Não vendemos ou comercializamos seus dados pessoais. O compartilhamento se limita a:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-[var(--app-text)]">Prestadores de serviço:</strong> Supabase (hospedagem e autenticação) e Vercel (hospedagem do site), que atuam como operadores de dados.</li>
              <li><strong className="text-[var(--app-text)]">Compartilhamento intencional:</strong> quando você compartilha uma lista com outra pessoa, os dados daquela lista ficam visíveis para o usuário convidado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">6. Cookies</h2>
            <p>
              Utilizamos cookies essenciais (sessão, autenticação) e, com seu consentimento, cookies não essenciais para analytics e marketing.
              Você pode gerenciar suas preferências de cookies a qualquer momento por meio do banner de consentimento ou limpando os dados do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">7. Direitos do Titular</h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-[var(--app-text)]">Acesso:</strong> solicitar confirmação da existência de tratamento e acesso aos seus dados.</li>
              <li><strong className="text-[var(--app-text)]">Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong className="text-[var(--app-text)]">Exclusão:</strong> solicitar a exclusão de dados desnecessários ou excessivos, ou eliminação de dados tratados com consentimento.</li>
              <li><strong className="text-[var(--app-text)]">Portabilidade:</strong> solicitar a transferência dos seus dados para outro serviço ou fornecedor, em formato estruturado e interoperável.</li>
              <li><strong className="text-[var(--app-text)]">Revogação do consentimento:</strong> retirar o consentimento para tratamento de dados a qualquer momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">8. Como Exercer seus Direitos</h2>
            <p>
              Para exercer qualquer dos direitos acima, entre em contato conosco pelo e-mail:{' '}
              <a href="mailto:contato@listtobuy.com.br" className="underline text-[var(--app-accent)]">
                contato@listtobuy.com.br
              </a>
            </p>
            <p className="mt-2">
              Responderemos sua solicitação em até <strong className="text-[var(--app-text)]">15 dias úteis</strong>, conforme exigido pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">9. Base Legal</h2>
            <p>
              O tratamento de dados pessoais no ListToBuy encontra amparo nas seguintes bases legais previstas no art. 7º da LGPD:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-[var(--app-text)]">Execução de contrato:</strong> quando necessário para fornecer o serviço solicitado.</li>
              <li><strong className="text-[var(--app-text)]">Consentimento:</strong> quando você opta por cookies não essenciais ou compartilhamento de listas.</li>
              <li><strong className="text-[var(--app-text)]">Legítimo interesse:</strong> para segurança, prevenção de fraudes e melhoria do serviço.</li>
              <li><strong className="text-[var(--app-text)]">Cumprimento de obrigação legal:</strong> quando exigido por lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">10. Retenção de Dados</h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Você pode solicitar a exclusão da conta a qualquer momento.
              Após a exclusão, os dados serão removidos em até <strong className="text-[var(--app-text)]">30 dias</strong>, exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--app-text)] mb-3">11. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas por meio do aplicativo ou por e-mail.
              A data da última atualização é indicada no rodapé desta página.
            </p>
            <p className="mt-2 text-sm">Última atualização: Agosto de 2026.</p>
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
