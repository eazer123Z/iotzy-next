import { useState, useEffect, useCallback } from 'react'
import { apiCall } from '../lib/api'

export function useAutomation() {
  const [rules, setRules]       = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    const [rRes, sRes] = await Promise.all([
      apiCall('get_automation_rules'),
      apiCall('get_schedules'),
    ])
    setRules(rRes?.rules ?? (Array.isArray(rRes) ? rRes : []))
    setSchedules(sRes?.schedules ?? (Array.isArray(sRes) ? sRes : []))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addRule = useCallback(async (data) => {
    const res = await apiCall('add_automation_rule', data)
    if (res?.success) await load()
    return res
  }, [load])

  const updateRule = useCallback(async (id, data) => {
    const res = await apiCall('update_automation_rule', { id, ...data })
    if (res?.success) await load()
    return res
  }, [load])

  const deleteRule = useCallback(async (id) => {
    const res = await apiCall('delete_automation_rule', { id })
    if (res?.success) setRules(prev => prev.filter(r => String(r.id) !== String(id)))
    return res
  }, [])

  const addSchedule = useCallback(async (data) => {
    const res = await apiCall('add_schedule', data)
    if (res?.success) await load()
    return res
  }, [load])

  const toggleSchedule = useCallback(async (id, enabled) => {
    const res = await apiCall('toggle_schedule', { id, is_enabled: enabled ? 1 : 0 })
    if (res?.success) {
      setSchedules(prev => prev.map(s =>
        String(s.id) === String(id) ? { ...s, is_enabled: enabled ? 1 : 0 } : s
      ))
    }
    return res
  }, [])

  const deleteSchedule = useCallback(async (id) => {
    const res = await apiCall('delete_schedule', { id })
    if (res?.success) setSchedules(prev => prev.filter(s => String(s.id) !== String(id)))
    return res
  }, [])

  return {
    rules, schedules, loading,
    addRule, updateRule, deleteRule,
    addSchedule, toggleSchedule, deleteSchedule,
    reload: load,
  }
}
