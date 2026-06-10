import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../src/lib/supabase/admin';

async function requireAdmin(request?: Request) {
  // Try Authorization header first (most reliable for mutation requests)
  const authHeader = request?.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('role').eq('id', user.id).single();
      return profile?.role === 'admin' || profile?.role === 'super_admin';
    }
  }

  // Fallback: cookie-based session
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role').eq('id', user.id).single();

  return profile?.role === 'admin' || profile?.role === 'super_admin';
}

export async function GET(request: Request) {
  const isAdmin = await requireAdmin(request);

  if (!isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: authUsers, error: authError } =
    await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 });
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, group_id, active, first_name, last_name');

  if (profilesError) {
    return Response.json({ error: profilesError.message }, { status: 500 });
  }

  const users = authUsers.users.map((user) => {
  const profile = profiles?.find((p) => p.id === user.id);
  const metadata = user.user_metadata || {};

  const first_name =
    profile?.first_name ||
    metadata.first_name ||
    metadata.firstName ||
    '';

  const last_name =
    profile?.last_name ||
    metadata.last_name ||
    metadata.lastName ||
    '';

  return {
    id: user.id,
    email: user.email || profile?.email || '',
    first_name,
    last_name,
    role: profile?.role || 'viewer',
    group_id: profile?.group_id || null,
    is_active: profile?.active ?? true,
    last_sign_in_at: user.last_sign_in_at || null,
  };
});

  return Response.json({ users });
}

export async function PATCH(request: Request) {
  const isAdmin = await requireAdmin(request);

  if (!isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const userId = body.userId || body.id;

  if (!userId) {
    return Response.json({ error: 'Missing user id' }, { status: 400 });
  }

  const updates: {
  role?: string;
  active?: boolean;
  first_name?: string;
  last_name?: string;
} = {};

  if (body.role !== undefined) {
    updates.role = body.role;
  }

  if (body.active !== undefined) {
    updates.active = body.active;
  }

  if (body.is_active !== undefined) {
    updates.active = body.is_active;
  }
  if (body.first_name !== undefined) {
  updates.first_name = body.first_name;
}

if (body.last_name !== undefined) {
  updates.last_name = body.last_name;
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

export async function DELETE(request: Request) {
  const isAdmin = await requireAdmin(request);

  if (!isAdmin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const userId = body.userId || body.id;

  if (!userId) {
    return Response.json({ error: 'Missing user id' }, { status: 400 });
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 });
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}