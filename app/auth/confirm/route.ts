import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    return NextResponse.redirect(
      `caseguide://reset-password?token_hash=${token_hash}&type=${type}`
    );
  }

  return NextResponse.redirect(new URL("/sign-in", request.url));
}
