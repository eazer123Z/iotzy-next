import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { createMqttClient } from '../lib/mqtt'

const MqttContext = createContext(null)

export function MqttProvider({ settings, children }) {
  const [connected, setConnected] = useState(false)
  const clientRef  = useRef(null)
  const handlersRef = useRef({}) // topic → [callback, ...]

  const subscribe = useCallback((topic, cb) => {
    if (!handlersRef.current[topic]) handlersRef.current[topic] = []
    handlersRef.current[topic].push(cb)
    clientRef.current?.subscribe(topic)
    return () => {
      handlersRef.current[topic] = handlersRef.current[topic]?.filter(fn => fn !== cb)
    }
  }, [])

  const publish = useCallback((topic, payload) => {
    return clientRef.current?.publish(topic, payload) ?? false
  }, [])

  const connect = useCallback(() => {
    if (!settings?.mqtt_broker) return
    clientRef.current?.disconnect()

    const mqttClient = createMqttClient({
      broker:   settings.mqtt_broker,
      port:     settings.mqtt_port || 8884,
      path:     settings.mqtt_path || '/mqtt',
      useSSL:   !!settings.mqtt_use_ssl,
      username: settings.mqtt_username || '',
      onConnect: () => {
        setConnected(true)
        // Re-subscribe semua topik setelah reconnect
        Object.keys(handlersRef.current).forEach(t => mqttClient.subscribe(t))
      },
      onDisconnect: () => setConnected(false),
      onMessage: (topic, payload) => {
        const handlers = handlersRef.current[topic] || []
        handlers.forEach(fn => fn(topic, payload))
      },
    })

    clientRef.current = mqttClient
    mqttClient.connect()
  }, [settings])

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
    setConnected(false)
  }, [])

  // Auto-connect saat settings tersedia
  useEffect(() => {
    if (settings?.mqtt_broker) connect()
    return () => clientRef.current?.disconnect()
  }, [settings?.mqtt_broker]) // eslint-disable-line

  return (
    <MqttContext.Provider value={{ connected, connect, disconnect, subscribe, publish }}>
      {children}
    </MqttContext.Provider>
  )
}

export const useMqtt = () => useContext(MqttContext)
