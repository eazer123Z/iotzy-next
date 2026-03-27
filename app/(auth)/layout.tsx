import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg overflow-hidden relative selection:bg-accent selection:text-bg">
      {/* Background subtle decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-danger/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-fadeIn px-6">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent text-bg shadow-sm flex items-center justify-center text-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <i className="fas fa-microchip"></i>
          </div>
          <h1 className="text-3xl font-black mt-6 text-heading tracking-tighter">
            IoTzy <span className="text-accent underline decoration-accent/20 underline-offset-8">Smooth</span>
          </h1>
        </div>

        {/* Auth Content Card */}
        <div className="card p-10 shadow-sm bg-surface/40">
          {children}
        </div>

        <div className="flex flex-col items-center mt-10 space-y-2 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">
             DeepMind Agentic Systems :: v4.1.0
           </p>
           <p className="text-[9px] font-bold text-text-muted">
             (C) 2026 :: All Rights Reserved
           </p>
        </div>
      </div>
    </div>
  );
}
