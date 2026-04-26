import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../src/lib/supabase/admin';

async function requireAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function GET() {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: authUsers, error: authError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 });
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, group_id, active');

  if (profilesError) {
    return Response.json({ error: profilesError.message }, { status: 500 });
  }

  const users = authUsers.users.map((user) => {
    const profile = profiles?.find((p) => p.id === user.id);

    return {
      id: user.id,
      email: user.email || profile?.email || '',
      role: profile?.role || 'viewer',
      group_id: profile?.group_id || null,
      is_active: profile?.active ?? true,
      created_at: user.created_at,
    };
  });

  return Response.json({ users });
}

export async function PATCH(request: Request) {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();

  const userId = body.userId || body.id;

  if (!userId) {
    return Response.json({ error: 'Missing user id' }, { status: 400 });
  }

  const updates: { role?: string; active?: boolean } = {};

  if (body.role !== undefined) {
    updates.role = body.role;
  }

  if (body.active !== undefined) {
    updates.active = body.active;
  }

  if (body.is_active !== undefined) {
    updates.active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}