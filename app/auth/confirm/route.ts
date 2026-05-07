import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const safeTokenHash = encodeURIComponent(token_hash);
    const safeType = encodeURIComponent(type);
    const deepLink = `caseguide://reset-password?token_hash=${safeTokenHash}&type=${safeType}`;
    const encodedDeepLink = deepLink.replace(/"/g, '&quot;');
    return new NextResponse(
      `<html><head><meta http-equiv="refresh" content="0;url=${encodedDeepLink}"></head><body><a href="${encodedDeepLink}">Open App</a></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return NextResponse.redirect(new URL("/sign-in", request.url));
}
