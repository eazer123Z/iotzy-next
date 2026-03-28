import { useState, useEffect, useCallback, useRef } from 'react'
import { apiCall } from '../lib/api'
import { useMqtt } from '../context/MqttContext'

export function useDevices() {
  const [devices, setDevices]   = useState([])
  const [loading, setLoading]   = useState(true)
  const onAtRef = useRef({})     // deviceId → timestamp saat ON
  const { subscribe, publish }  = useMqtt()

  const load = useCallback(async () => {
    const res = await apiCall('get_devices')
    if (res?.success !== false && Array.isArray(res)) {
      setDevices(res)
    } else if (Array.isArray(res?.devices)) {
      setDevices(res.devices)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Subscribe topik MQTT setiap device
  useEffect(() => {
    const unsubs = []
    devices.forEach(d => {
      if (d.topic_sub) {
        const unsub = subscribe(d.topic_sub, (_, payload) => {
          try {
            const data = JSON.parse(payload)
            const newState = data.state === 1 || data.state === true || data.state === 'on'
            setDevices(prev => prev.map(dev =>
              String(dev.id) === String(d.id)
                ? { ...dev, last_state: newState ? 1 : 0, latest_state: newState ? 1 : 0 }
                : dev
            ))
            apiCall('update_device_state', { id: d.id, state: newState ? 1 : 0, trigger: 'MQTT' })
          } catch {
            const raw = payload.toLowerCase().trim()
            const st  = raw === '1' || raw === 'on' ? 1 : 0
            setDevices(prev => prev.map(dev =>
              String(dev.id) === String(d.id) ? { ...dev, last_state: st } : dev
            ))
          }
        })
        unsubs.push(unsub)
      }
    })
    return () => unsubs.forEach(u => u?.())
  }, [devices.length, subscribe]) // eslint-disable-line

  const toggle = useCallback(async (deviceId, newState) => {
    const id = String(deviceId)
    setDevices(prev => prev.map(d =>
      String(d.id) === id ? { ...d, last_state: newState ? 1 : 0, latest_state: newState ? 1 : 0 } : d
    ))
    if (newState) onAtRef.current[id] = Date.now()
    else delete onAtRef.current[id]

    const device = devices.find(d => String(d.id) === id)
    if (device?.topic_pub) publish(device.topic_pub, { state: newState ? 1 : 0 })
    await apiCall('update_device_state', { id, state: newState ? 1 : 0, trigger: 'Manual' })
  }, [devices, publish])

  const add = useCallback(async (data) => {
    const res = await apiCall('add_device', data)
    if (res?.success) await load()
    return res
  }, [load])

  const update = useCallback(async (id, data) => {
    const res = await apiCall('update_device', { id, ...data })
    if (res?.success) await load()
    return res
  }, [load])

  const remove = useCallback(async (id) => {
    const res = await apiCall('delete_device', { id })
    if (res?.success) setDevices(prev => prev.filter(d => String(d.id) !== String(id)))
    return res
  }, [])

  const getOnDuration = useCallback((id) => {
    const ts = onAtRef.current[String(id)]
    return ts ? Date.now() - ts : 0
  }, [])

  return { devices, loading, toggle, add, update, remove, reload: load, getOnDuration }
}
