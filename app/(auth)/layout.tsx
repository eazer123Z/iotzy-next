import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(191,0,255,0.08)_0%,transparent_50%)]" />

      <div className="w-full max-w-md z-10 animate-fadeIn px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-3xl text-white shadow-[0_0_30px_var(--accent-glow)] animate-pulse">
            <i className="fas fa-bolt"></i>
          </div>
          <h1 className="text-[32px] font-extrabold mt-5 text-heading">
            IoTzy
          </h1>
        </div>

        {/* Auth Card */}
        <div className="bg-[rgba(10,15,30,0.6)] backdrop-blur-[25px] border border-border rounded-[24px] p-9 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          {children}
        </div>

        <p className="text-center text-txt-muted text-xs mt-8">
          IoTzy By Rendy Aulia Nur
        </p>
      </div>
    </div>
  );
}
