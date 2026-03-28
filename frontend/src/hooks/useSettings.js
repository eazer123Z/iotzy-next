import { useState, useCallback } from 'react'
import { apiCall } from '../lib/api'

export function useSettings(initialSettings = null) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving]     = useState(false)

  const save = useCallback(async (data) => {
    setSaving(true)
    const res = await apiCall('save_settings', data)
    if (res?.success) setSettings(prev => ({ ...prev, ...data }))
    setSaving(false)
    return res
  }, [])

  const saveProfile = useCallback(async (data) => {
    setSaving(true)
    const res = await apiCall('update_profile', data)
    setSaving(false)
    return res
  }, [])

  const changePassword = useCallback(async (data) => {
    setSaving(true)
    const res = await apiCall('change_password', data)
    setSaving(false)
    return res
  }, [])

  const getMqttTemplates = useCallback(async () => {
    return apiCall('get_mqtt_templates')
  }, [])

  const testTelegram = useCallback(async () => {
    return apiCall('test_telegram')
  }, [])

  return { settings, setSettings, saving, save, saveProfile, changePassword, getMqttTemplates, testTelegram }
}
