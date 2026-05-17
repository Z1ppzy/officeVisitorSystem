import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, publicUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user) {
    return unauthorized();
  }

  return NextResponse.json({ user: publicUser(user) });
}
