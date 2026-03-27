"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Hard redirect — ensures cookie is committed before navigation
        window.location.href = "/";
      } else {
        setError(data.error || "Login gagal.");
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
        Smart Room Dashboard
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
            Username atau Email
          </label>
          <div className="relative">
            <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted text-sm"></i>
            <input
              type="text"
              name="username"
              className="input-field pl-10"
              placeholder="Masukkan username"
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
              Menghubungkan...
            </>
          ) : (
            <>
              <i className="fas fa-right-to-bracket"></i>
              Masuk ke Dashboard
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-txt-muted mt-6">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="text-accent hover:text-accent-light font-semibold"
        >
          Daftar sekarang
        </Link>
      </p>
    </>
  );
}
