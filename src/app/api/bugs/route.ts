import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { bugReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';

const bugReportSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(2000, 'Descrição muito longa'),
  email: z.string().email('Email inválido').optional().nullable(),
  category: z.enum(['bug', 'suggestion', 'other']).default('bug'),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Faça login para reportar bugs' }, { status: 401 });
    }

    const body = await request.json();
    const result = bugReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message || 'Dados inválidos' }, { status: 400 });
    }

    const { title, description, email, category } = result.data;

    await db.insert(bugReports).values({
      userId: user.id,
      title,
      description,
      email: email || null,
      category,
      status: 'open',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar report. Tente novamente.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Faça login para ver seus reports' }, { status: 401 });
    }

    const reports = await db.select().from(bugReports).where(eq(bugReports.userId, user.id)).orderBy(bugReports.createdAt);

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar reports' }, { status: 500 });
  }
}