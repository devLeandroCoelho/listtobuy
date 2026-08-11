import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware de autenticação — protege rotas do dashboard.
 *
 * Fluxo:
 * 1. Verifica se existe session/cookie de autenticação
 * 2. Se não existe e rota é protegida → redireciona para /login
 * 3. Se existe e rota é pública (login/register) → redireciona para /dashboard
 * 4. Renova token de refresh se necessário
 */

/** Rotas que exigem autenticação */
const protectedRoutes = ['/dashboard'];

/** Rotas públicas (autenticado não deveria acessar) */
const publicRoutes = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Cria cliente Supabase com gerenciamento de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Define cookies na request (para server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Cria nova resposta para propagar cookies atualizados
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Renova sessão automaticamente (importante para tokens que expiram)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Verifica se rota é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verifica se rota é pública
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Redireciona para login se rota protegida sem autenticação
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redireciona para dashboard se autenticado em rota pública
  if (isPublicRoute && user && pathname !== '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica middleware em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - imagens publicadas
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
