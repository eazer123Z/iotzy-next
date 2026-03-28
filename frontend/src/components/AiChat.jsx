import { useState, useRef, useEffect } from 'react'
import { useAiChat } from '../hooks/useAiChat'

export default function AiChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const bodyRef = useRef(null)
  const { messages, loading, send, loadHistory, clearHistory } = useAiChat()

  useEffect(() => {
    if (open) {
      loadHistory()
      setTimeout(() => bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight), 100)
    }
  }, [open, loadHistory])

  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight)
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const txt = input
    setInput('')
    await send(txt)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      <button
        className={`ai-chat-btn${open ? ' active' : ''}`}
        id="aiChatBtn"
        title="Tanya AI"
        onClick={() => setOpen(o => !o)}
      >
        <i className="fas fa-robot" />
      </button>

      <div className={`ai-chat-modal${open ? ' active' : ''}`} id="aiChatModal">
        <div className="ai-chat-header">
          <span><i className="fas fa-robot" /> IoTzy AI Assistant</span>
          <div className="ai-chat-header-actions">
            <button className="ai-chat-clear" onClick={clearHistory} title="Hapus Riwayat">
              <i className="fas fa-broom" />
            </button>
            <button className="ai-chat-close" onClick={() => setOpen(false)} title="Tutup">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="ai-chat-body" id="aiChatBody" ref={bodyRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.sender}`}
              dangerouslySetInnerHTML={{ __html: msg.message }}
            />
          ))}
          {loading && (
            <div className="chat-bubble bot">
              <i className="fas fa-spinner fa-spin" /> Memproses...
            </div>
          )}
        </div>

        <div className="ai-chat-footer">
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Tulis instruksi automasi..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            autoComplete="off"
          />
          <button className="ai-chat-send" onClick={handleSend} disabled={loading} title="Kirim">
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>
    </>
  )
}
