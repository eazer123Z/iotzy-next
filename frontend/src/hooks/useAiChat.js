import { useState, useCallback } from 'react'
import { apiCall } from '../lib/api'

const TIMEOUT_MS = 130_000

export function useAiChat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', message: 'Halo! Saya asisten AI untuk sistem IoT Anda. Ada yang bisa saya bantu hari ini?' }
  ])
  const [loading, setLoading]   = useState(false)
  const [loaded, setLoaded]     = useState(false)

  const loadHistory = useCallback(async () => {
    if (loaded) return
    const res = await apiCall('get_ai_chat_history')
    if (res?.success && Array.isArray(res.history) && res.history.length > 0) {
      setMessages(res.history)
    }
    setLoaded(true)
  }, [loaded])

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { sender: 'user', message: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await apiCall('ai_chat_process', { message: text })
      clearTimeout(timer)
      if (res?.success && res.response) {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', message: res.response, created_at: new Date().toISOString() }
        ])
        // Jika AI mengembalikan aksi UI (navigate, refresh), bisa di-handle di sini
        return res
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', message: res?.error || 'Gagal memproses. Coba lagi ya 😊', created_at: new Date().toISOString() }
        ])
      }
    } catch (err) {
      clearTimeout(timer)
      setMessages(prev => [
        ...prev,
        { sender: 'bot', message: 'Koneksi AI terputus, coba lagi ya 🔄', created_at: new Date().toISOString() }
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const clearHistory = useCallback(async () => {
    const res = await apiCall('delete_chat_history')
    if (res?.success) {
      setMessages([{ sender: 'bot', message: 'Riwayat dihapus. Ada yang bisa saya bantu?' }])
      setLoaded(false)
    }
    return res
  }, [])

  return { messages, loading, send, loadHistory, clearHistory }
}
