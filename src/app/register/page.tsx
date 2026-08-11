'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

    // 1. Criar usuário no Auth
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

    // 2. Criar perfil na tabela users (quando o signup retorna sessão)
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

    // 3. Confirmação de email habilitada no Supabase
    if (authData.user) {
      setNeedsEmailConfirmation(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">🛒</span>
          <h1 className="text-2xl font-bold mt-2">Criar Conta</h1>
          <p className="text-gray-600">Comece a economizar agora</p>
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={6}
              required
              aria-required="true"
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="text-xs text-gray-500 mt-1">
              Mínimo de 6 caracteres
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || needsEmailConfirmation}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Conta Grátis'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
