import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, email, password, fullName } = await req.json();

    const result = await registerUser(username, email, password, fullName);

    if (result.success) {
      return NextResponse.json({ success: true, redirect: "/login?registered=1" });
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Server error." },
      { status: 500 }
    );
  }
}
