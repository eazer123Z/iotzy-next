import { useState, useEffect, useCallback } from 'react'
import { apiCall } from '../lib/api'

export function useLogs() {
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await apiCall('get_logs', {})
    const arr = Array.isArray(res) ? res : (res?.logs ?? [])
    setLogs(arr)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addLog = useCallback(async (device, activity, trigger = 'Manual', type = 'info') => {
    const entry = {
      device_name: device,
      activity,
      trigger_type: trigger,
      log_type: type,
      created_at: new Date().toISOString(),
    }
    setLogs(prev => [entry, ...prev].slice(0, 500))
    apiCall('add_log', { device, activity, trigger, type })
  }, [])

  const clearLogs = useCallback(async () => {
    const res = await apiCall('clear_logs')
    if (res?.success) setLogs([])
    return res
  }, [])

  return { logs, loading, addLog, clearLogs, reload: load }
}
