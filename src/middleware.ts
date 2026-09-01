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
 *
 * 🔒 Blindagem contra indisponibilidade do Supabase:
 * `supabase.auth.getUser()` é uma chamada de rede que pode travar (timeout lento)
 * quando o Supabase está fora/pausado. Como este middleware roda em TODA rota
 * (inclusive páginas estáticas), uma chamada bloqueante sem timeout derrubava o
 * site inteiro com 504 MIDDLEWARE_INVOCATION_TIMEOUT (o Vercel mata a função
 * acima de ~25s). Para o site nunca mais cair por isso, envolvemos o getUser()
 * num `Promise.race` com timeout gracioso: se o Supabase não responder, tratamos
 * o usuário como `null` e seguimos com o roteamento. Máximo que acontece: o
 * usuário não é reconhecido como logado e é redirecionado para /login na rota
 * protegida — o site continua no ar.
 */

/** Tempo máximo (ms) de espera pelo Supabase antes de tratar o usuário como `null`. */
const USER_TIMEOUT_MS = 3000;

/** Rotas que exigem autenticação */
const protectedRoutes = ['/dashboard'];

/** Rotas públicas (autenticado não deveria acessar) */
const publicRoutes = ['/login', '/register', '/'];

/**
 * Busca o usuário autenticado com timeout gracioso.
 *
 * Se o Supabase não responder dentro de `ms`, resolve como `{ user: null }`
 * em vez de lançar erro — nunca deixamos propagar exceção nem travamos a
 * requisição. Em Edge runtime o `setTimeout` funciona normalmente.
 */
async function getAuthUserWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
  ms: number
) {
  let timeout;
  // Formato idêntico ao retorno de getUser() para o Promise.race devolver
  // um tipo único e o destructuring `{ data: { user } }` funcionar nos dois casos.
  const timeoutPromise = new Promise<{ data: { user: null }; error: null }>(
    (resolve) => {
      timeout = setTimeout(
        () => resolve({ data: { user: null }, error: null }),
        ms
      );
    }
  );
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

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

  // Renova sessão automaticamente (importante para tokens que expiram).
  // Envolto em Promise.race com timeout gracioso: se o Supabase estiver fora,
  // resolve com user null em vez de travar/estourar o 504 (ver doc no topo).
  const {
    data: { user },
  } = await getAuthUserWithTimeout(supabase, USER_TIMEOUT_MS);

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
