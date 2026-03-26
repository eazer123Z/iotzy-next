export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, new: newPass, confirm } = await req.json();

  if (!current || !newPass || !confirm) {
    return NextResponse.json(
      { error: "Semua field harus diisi" },
      { status: 400 }
    );
  }

  if (newPass !== confirm) {
    return NextResponse.json(
      { error: "Password baru tidak cocok" },
      { status: 400 }
    );
  }

  if (newPass.length < 8) {
    return NextResponse.json(
      { error: "Password baru minimal 8 karakter" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const valid = await bcrypt.compare(current, dbUser.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Password saat ini salah" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(newPass, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ success: true, message: "Password berhasil diubah" });
}
