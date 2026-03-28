import { useState, useEffect, useCallback } from 'react'
import { apiCall } from '../lib/api'
import { useMqtt } from '../context/MqttContext'

export function useSensors() {
  const [sensors, setSensors]   = useState([])
  const [history, setHistory]   = useState({}) // sensorId → [{val, ts}]
  const [loading, setLoading]   = useState(true)
  const { subscribe }           = useMqtt()

  const load = useCallback(async () => {
    const res = await apiCall('get_sensors')
    const arr = Array.isArray(res) ? res : (res?.sensors ?? [])
    setSensors(arr)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Subscribe topik MQTT setiap sensor
  useEffect(() => {
    const unsubs = []
    sensors.forEach(s => {
      if (!s.topic) return
      const unsub = subscribe(s.topic, (_, payload) => {
        let val
        try {
          const data = JSON.parse(payload)
          val = data.value !== undefined ? parseFloat(data.value) : parseFloat(payload)
        } catch { val = parseFloat(payload) }
        if (isNaN(val)) return

        setSensors(prev => prev.map(sv =>
          String(sv.id) === String(s.id) ? { ...sv, latest_value: val, last_seen: new Date().toISOString() } : sv
        ))
        setHistory(prev => {
          const arr = [...(prev[s.id] || []), { val, ts: Date.now() }].slice(-60)
          return { ...prev, [s.id]: arr }
        })
        apiCall('update_sensor_value', { id: s.id, value: val })
      })
      unsubs.push(unsub)
    })
    return () => unsubs.forEach(u => u?.())
  }, [sensors.length, subscribe]) // eslint-disable-line

  const add = useCallback(async (data) => {
    const res = await apiCall('add_sensor', data)
    if (res?.success) await load()
    return res
  }, [load])

  const update = useCallback(async (id, data) => {
    const res = await apiCall('update_sensor', { id, ...data })
    if (res?.success) await load()
    return res
  }, [load])

  const remove = useCallback(async (id) => {
    const res = await apiCall('delete_sensor', { id })
    if (res?.success) setSensors(prev => prev.filter(s => String(s.id) !== String(id)))
    return res
  }, [])

  const getReadings = useCallback(async (sensorId, hours = 24) => {
    return apiCall('get_sensor_readings', { sensor_id: sensorId, hours })
  }, [])

  return { sensors, history, loading, add, update, remove, reload: load, getReadings }
}
