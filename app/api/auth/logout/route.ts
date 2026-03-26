import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await destroySession();
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(new URL("/login", origin));
}
