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
          message: data.data?.response_text || "Command executed successfully.",
          platform: "web",
        });
      } else {
        addChatMessage({
          sender: "bot",
          message: data.error || "Neural link error. Please retry.",
          platform: "web",
        });
      }
    } catch {
      addChatMessage({
        sender: "bot",
        message: "Connectivity issue. Re-establishing link...",
        platform: "web",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── FAB Button ── */}
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-2xl bg-accent text-bg shadow-lg flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-all z-[100]",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <i className="fas fa-comment-alt"></i>
      </button>

      {/* ── Chat Window ── */}
      <div className={clsx(
        "fixed right-6 bottom-24 md:right-8 md:bottom-8 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-8rem)] card shadow-2xl z-[101] flex flex-col overflow-hidden transition-all duration-3 scale-95 origin-bottom-right",
        open ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95 pointer-events-none"
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-bg-2/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-lg">
                <i className="fas fa-robot"></i>
             </div>
             <div>
                <h4 className="text-xs font-black text-heading uppercase tracking-widest leading-none mb-1">IoTzy Assistant</h4>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                   <span className="text-[9px] font-bold uppercase text-text-muted tracking-[1px]">Neural core active</span>
                </div>
             </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-bg-2 text-text-muted hover:text-heading flex items-center justify-center transition-all"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
              <i className="fas fa-terminal text-3xl mb-4 text-text-muted"></i>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-text-muted">Waiting for uplink...</p>
            </div>
          )}

          {chatMessages.map((m, i) => (
            <div key={i} className={clsx("flex flex-col gap-1", m.sender === "user" ? "items-end" : "items-start")}>
               <div className={clsx(
                 "px-4 py-3 rounded-2xl text-[11px] font-bold leading-relaxed max-w-[85%] shadow-sm",
                 m.sender === "user"
                   ? "bg-accent text-bg rounded-tr-none"
                   : "bg-bg-2 border border-border text-text-secondary rounded-tl-none"
               )}>
                 {m.message}
               </div>
               <span className="text-[8px] font-black text-text-muted uppercase tracking-widest px-1 opacity-40">
                 {m.sender === "user" ? "Authorised" : "AI Kernel"}
               </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
               <div className="px-4 py-3 rounded-2xl bg-bg-2 border border-border flex gap-1.5 items-center">
                  <div className="w-1 h-1 rounded-full bg-accent animate-bounce" />
                  <div className="w-1 h-1 rounded-full bg-accent animate-bounce delay-75" />
                  <div className="w-1 h-1 rounded-full bg-accent animate-bounce delay-150" />
               </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Footer Input */}
        <div className="p-5 border-t border-border bg-bg-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter neural command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-bg border border-border text-xs font-bold placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-all"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className={clsx(
                "absolute right-1.5 top-1.5 w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                input.trim() 
                  ? "bg-accent text-bg shadow-sm" 
                  : "text-text-muted opacity-20 cursor-not-allowed"
              )}
            >
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
             <span className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest">Secure Link v4.1</span>
             <button onClick={() => setChatMessages([])} className="text-[8px] font-black text-text-muted uppercase tracking-widest hover:text-danger">Clear Logs</button>
          </div>
        </div>
      </div>
    </>
  );
}
