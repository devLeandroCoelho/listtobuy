'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(data);
      setLoading(false);
    };

    getUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🛒</span>
            <span className="text-xl font-bold">ListToBuy</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Olá, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              aria-label="Sair da conta"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Minhas Listas</h1>
          <Link
            href="/dashboard/lists/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            aria-label="Criar nova lista de compras"
          >
            + Nova Lista
          </Link>
        </div>

        {/* Empty state */}
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4" aria-hidden="true">📝</div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma lista ainda</h2>
          <p className="text-gray-600 mb-6">
            Crie sua primeira lista de compras e comece a economizar.
          </p>
          <Link
            href="/dashboard/lists/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            aria-label="Criar sua primeira lista de compras"
          >
            Criar Primeira Lista
          </Link>
        </div>
      </main>
    </div>
  );
}
