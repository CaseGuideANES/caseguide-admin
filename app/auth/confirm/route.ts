import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '';

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Mobile deep link flow — pass token to the app via deep link
  if (next.startsWith('caseguide://')) {
    const safeTokenHash = encodeURIComponent(token_hash);
    const safeType = encodeURIComponent(type);
    const deepLink = `caseguide://reset-password?token_hash=${safeTokenHash}&type=${safeType}`;
    const encodedDeepLink = deepLink.replace(/"/g, '&quot;');
    return new NextResponse(
      `<html><head><meta http-equiv="refresh" content="0;url=${encodedDeepLink}"></head><body><a href="${encodedDeepLink}">Open App</a></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Web flow — verify token, establish session, redirect to reset-password page
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as any,
  });

  if (!error) {
    const redirectPath = type === 'recovery' ? '/reset-password' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, origin));
  }

  return NextResponse.redirect(new URL('/sign-in', request.url));
}
