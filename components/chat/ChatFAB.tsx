"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { useAppStore } from "@/lib/store";

export default function ChatFAB() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { chatMessages, addChatMessage, setChatMessages } = useAppStore();
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && chatMessages.length === 0) {
      fetch("/api/chat")
        .then((r) => r.json())
        .then((data) => {
          if (data.history) setChatMessages(data.history);
        });
    }
  }, [open, chatMessages.length, setChatMessages]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    addChatMessage({ sender: "user", message: msg, platform: "web" });
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (data.success) {
        addChatMessage({
          sender: "bot",
          message: data.data?.response_text || "Task completed successfully, Commander.",
          platform: "web",
        });
      } else {
        addChatMessage({
          sender: "bot",
          message: data.error || "Neural link failure. Rebooting coms...",
          platform: "web",
        });
      }
    } catch {
      addChatMessage({
        sender: "bot",
        message: "Connectivity lost. Re-establishing link...",
        platform: "web",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Neural FAB ── */}
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "fixed bottom-8 right-8 w-16 h-16 rounded-[24px] bg-gradient-to-br from-accent to-accent-light text-bg shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center text-2xl hover:scale-110 active:scale-90 transition-all z-50 group",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 rounded-[24px] bg-white/20 animate-pulse" />
        <i className="fas fa-atom relative z-10 group-hover:rotate-180 transition-transform duration-700"></i>
      </button>

      {/* ── Chat Interface ── */}
      <div className={clsx(
        "fixed right-8 bottom-8 w-[420px] max-w-[calc(100vw-4rem)] bg-surface-solid border border-border/50 rounded-[40px] shadow-2xl z-[60] flex flex-col overflow-hidden transition-all duration-500 origin-bottom-right backdrop-blur-3xl",
        open ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-12 pointer-events-none"
      )}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/40 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center text-xl">
                   <i className="fas fa-atom"></i>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-success border-4 border-surface-solid shadow-[0_0_10px_var(--success)]" />
             </div>
             <div>
                <h4 className="text-sm font-black text-heading uppercase tracking-widest leading-none mb-1">Neural AI</h4>
                <div className="flex items-center gap-1.5 opacity-60">
                   <span className="text-[10px] font-black uppercase text-text-muted tracking-[1px]">Operational Sub-Core</span>
                </div>
             </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-heading flex items-center justify-center transition-all"
          >
            <i className="fas fa-angles-right"></i>
          </button>
        </div>

        {/* Neural Stream (Messages) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 min-h-[350px] max-h-[500px] scrollbar-hide">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-text-muted/20 text-3xl mb-4">
                 <i className="fas fa-wave-square"></i>
              </div>
              <h5 className="text-xs font-black text-text-muted uppercase tracking-[3px]">Awaiting Commands</h5>
              <p className="text-[10px] font-bold text-text-muted/40 mt-1 uppercase">Neural bridge ready for secure transmission.</p>
            </div>
          )}

          {chatMessages.map((m, i) => (
            <div key={i} className={clsx("flex flex-col gap-1.5", m.sender === "user" ? "items-end" : "items-start")}>
               <div className={clsx(
                 "p-4 rounded-3xl text-xs font-bold leading-relaxed max-w-[85%] border shadow-sm",
                 m.sender === "user"
                   ? "bg-accent/10 border-accent/20 text-text-secondary rounded-tr-none"
                   : "bg-surface/50 border-border/40 text-text-secondary rounded-tl-none backdrop-blur-md"
               )}>
                 {m.message}
               </div>
               <span className="text-[8px] font-black text-text-muted uppercase tracking-widest px-2 opacity-40">
                 {m.sender === "user" ? "Authorized Cmdr" : "Neural Link v3.2"}
               </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 animate-pulse">
               <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex gap-2 items-center">
                  <div className="w-1 h-1 rounded-full bg-accent animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-accent animate-bounce delay-75" />
                  <div className="w-1 h-1 rounded-full bg-accent animate-bounce delay-150" />
               </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Command Input Area */}
        <div className="p-8 border-t border-border/40 bg-white/5">
          <div className="relative group">
            <input
              type="text"
              placeholder="Transmit neural command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="w-full pl-6 pr-14 py-4 rounded-[20px] bg-black/40 border border-border/40 text-sm font-bold placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 focus:shadow-[0_0_20px_rgba(0,242,255,0.05)] transition-all"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className={clsx(
                "absolute right-2 top-2 w-10 h-10 rounded-[14px] flex items-center justify-center transition-all active:scale-90",
                input.trim() 
                  ? "bg-accent text-bg shadow-[0_0_10px_var(--accent-glow)]" 
                  : "bg-white/5 text-text-muted opacity-30 cursor-not-allowed"
              )}
            >
              <i className="fas fa-arrow-up text-sm"></i>
            </button>
          </div>
          <div className="flex justify-between items-center mt-4">
             <div className="flex gap-4">
                <button className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-accent transition-colors">Clear Stream</button>
                <button className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-accent transition-colors">Manual</button>
             </div>
             <span className="text-[9px] font-black text-accent/50 uppercase tracking-widest">E2E ENCRYPTED TRANSMISSION</span>
          </div>
        </div>
      </div>
    </>
  );
}
