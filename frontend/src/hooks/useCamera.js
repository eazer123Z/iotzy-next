import { useState, useRef, useCallback } from 'react'
import { apiCall } from '../lib/api'

export function useCamera() {
  const [stream, setStream]           = useState(null)
  const [active, setActive]           = useState(false)
  const [devices, setDevices]         = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [personCount, setPersonCount] = useState(0)
  const [brightness, setBrightness]   = useState(0)
  const [lightCondition, setLightCondition] = useState('unknown')
  const videoRef = useRef(null)

  const loadDevices = useCallback(async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices()
      const cams  = devs.filter(d => d.kind === 'videoinput')
      setDevices(cams)
      if (cams.length > 0 && !selectedDeviceId) setSelectedDeviceId(cams[0].deviceId)
    } catch { setDevices([]) }
  }, [selectedDeviceId])

  const startCamera = useCallback(async (deviceId) => {
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      }
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(s)
      setActive(true)
      if (videoRef.current) videoRef.current.srcObject = s
      await apiCall('save_cv_config', { config: { is_active: true } })
    } catch (err) {
      console.error('Camera error:', err)
    }
  }, [])

  const stopCamera = useCallback(async () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setActive(false)
    if (videoRef.current) videoRef.current.srcObject = null
    await apiCall('save_cv_config', { config: { is_active: false } })
  }, [stream])

  const updateCvState = useCallback(async (count, bright, condition) => {
    setPersonCount(count)
    setBrightness(bright)
    setLightCondition(condition)
    // Sync ke DB — dipakai oleh Telegram bot & AI
    apiCall('save_cv_config', { config: { person_count: count, brightness: bright, light_condition: condition } })
  }, [])

  return {
    stream, active, devices, selectedDeviceId, setSelectedDeviceId,
    personCount, brightness, lightCondition,
    videoRef, loadDevices, startCamera, stopCamera, updateCvState,
  }
}
