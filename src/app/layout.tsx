import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ListToBuy',
  description: 'Lista de compras inteligente com controle de orçamento',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
