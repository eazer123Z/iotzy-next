"use client";

import { useState, useRef, useEffect } from "react";
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
  }, [open]);

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
          message: data.data?.response_text || "Siap!",
          platform: "web",
        });
      } else {
        addChatMessage({
          sender: "bot",
          message: data.error || "Error",
          platform: "web",
        });
      }
    } catch {
      addChatMessage({
        sender: "bot",
        message: "Koneksi gagal",
        platform: "web",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light text-white shadow-lg shadow-accent/30 flex items-center justify-center text-xl hover:scale-105 transition-all z-50 ${
          open ? "hidden" : ""
        }`}
      >
        <i className="fas fa-robot"></i>
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[380px] max-h-[600px] card rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-accent/10 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div>
                <div className="text-sm font-semibold">AI Assistant</div>
                <div className="text-[10px] text-txt-muted">IoTzy</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-surface text-txt-muted transition"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
            {chatMessages.length === 0 && (
              <div className="text-center text-txt-muted text-sm py-8">
                <i className="fas fa-comments text-3xl opacity-20 mb-2 block"></i>
                Kirim pesan ke AI Assistant
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    m.sender === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-surface border border-border rounded-bl-sm"
                  }`}
                >
                  {m.message}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-txt-muted">
                  <i className="fas fa-circle-notch fa-spin"></i>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik perintah..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/80 transition disabled:opacity-50"
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
