import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "caseguide://reset-password";

  if (token_hash && type) {
    return NextResponse.redirect(
      `https://caseguideapp.com/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${next}`
    );
  }

  return NextResponse.redirect(new URL("/sign-in", request.url));
}
