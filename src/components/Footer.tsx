import Link from 'next/link';
import { LogoMark } from './LogoMark';

export function Footer() {
  return (
    <footer className="bg-[var(--app-surface)] border-t border-[var(--app-border)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={24} variant="icon" />
            <span className="font-semibold text-[var(--app-text)]">ListToBuy</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm" aria-label="Links legais">
            <Link href="/privacy" className="text-[var(--app-text-secondary)] hover:text-[var(--app-accent)] transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/terms" className="text-[var(--app-text-secondary)] hover:text-[var(--app-accent)] transition-colors">
              Termos de Uso
            </Link>
          </nav>
          <p className="text-[var(--app-text-secondary)] text-sm">
            © 2026 ListToBuy. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
