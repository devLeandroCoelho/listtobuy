'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user && authData.session) {
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        name,
        email,
      });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }

      router.push('/dashboard');
      return;
    }

    if (authData.user) {
      setNeedsEmailConfirmation(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)]">
      <div className="w-full max-w-md p-8 bg-[var(--app-surface)] rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">🛒</span>
          <h1 className="text-2xl font-bold mt-2 text-[var(--app-text)]">Criar Conta</h1>
          <p className="text-[var(--app-text-secondary)]">Comece a economizar agora</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {needsEmailConfirmation && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm" role="status">
              Conta criada! Enviamos um link de confirmação para{' '}
              <strong>{email}</strong>. Verifique sua caixa de entrada (e o spam)
              e confirme para entrar.
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--app-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={6}
              required
              aria-required="true"
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="text-xs text-[var(--app-text-secondary)] mt-1">
              Mínimo de 6 caracteres
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || needsEmailConfirmation}
            className="w-full py-3 bg-[var(--app-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Conta Grátis'}
          </button>
        </form>

        <p className="text-center mt-6 text-[var(--app-text-secondary)]">
          Já tem conta?{' '}
          <Link href="/login" className="text-[var(--app-accent)] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
