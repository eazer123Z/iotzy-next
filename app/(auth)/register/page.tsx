"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          email: form.get("email"),
          password: form.get("password"),
          fullName: form.get("fullName"),
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/login?registered=1");
      } else {
        setError(data.error || "Pendaftaran gagal.");
      }
    } catch {
      setError("Kesalahan koneksi jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="text-sm text-txt-secondary text-center mb-6">
        Daftar Akun Baru
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-bg text-danger text-sm mb-4">
          <i className="fas fa-circle-exclamation"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Nama Lengkap
          </label>
          <div className="relative">
            <i className="fas fa-id-card absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="text"
              name="fullName"
              className="input-field pl-10"
              placeholder="Nama lengkap Anda"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Username
          </label>
          <div className="relative">
            <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="text"
              name="username"
              className="input-field pl-10"
              placeholder="Pilih username"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Email
          </label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="email"
              name="email"
              className="input-field pl-10"
              placeholder="alamat@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Password
          </label>
          <div className="relative">
            <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="password"
              name="password"
              className="input-field pl-10"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner animate-spin"></i>
              Memproses...
            </>
          ) : (
            <>
              <i className="fas fa-user-check"></i>
              Buat Akun
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-txt-muted mt-6">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="text-accent hover:text-accent-light font-semibold"
        >
          Login di sini
        </Link>
      </p>
    </>
  );
}
