/**
 * lib/mqtt.js
 * Wrapper Paho MQTT — library Paho tetap diload via CDN di index.html
 * Dipakai oleh useMqtt hook
 */

const CONFIG = {
  maxReconnect: 5,
  reconnectDelay: 3000,
}

export function createMqttClient({
  broker, port, path = '/mqtt', useSSL = true,
  username = '', password = '',
  onConnect, onDisconnect, onMessage,
}) {
  // Force WSS jika halaman HTTPS
  if (window.location.protocol === 'https:') useSSL = true
  if (port === 1883) port = 9001
  if (port === 8883) port = 8884

  const clientId = 'iotzy_web_' + Math.random().toString(16).slice(2, 8)
  const client = new window.Paho.MQTT.Client(broker, port, path, clientId)

  let reconnectCount = 0

  client.onConnectionLost = (res) => {
    onDisconnect?.(res.errorMessage)
    if (res.errorCode !== 0 && reconnectCount < CONFIG.maxReconnect) {
      const delay = CONFIG.reconnectDelay * Math.pow(2, reconnectCount++)
      setTimeout(() => connect(), delay)
    }
  }

  client.onMessageArrived = (msg) => {
    onMessage?.(msg.destinationName, msg.payloadString)
  }

  function connect() {
    const opts = {
      timeout: 10,
      keepAliveInterval: 30,
      cleanSession: true,
      useSSL,
      onSuccess: () => {
        reconnectCount = 0
        onConnect?.()
      },
      onFailure: (err) => {
        onDisconnect?.(err.errorMessage || 'Connection failed')
      },
    }
    if (username) opts.userName = username
    if (password) opts.password = password
    try { client.connect(opts) } catch (e) { onDisconnect?.(e.message) }
  }

  function disconnect() {
    try { if (client.isConnected()) client.disconnect() } catch (_) {}
  }

  function subscribe(topic) {
    try { if (client.isConnected()) client.subscribe(topic) } catch (_) {}
  }

  function publish(topic, payload) {
    if (!client.isConnected() || !topic) return false
    try {
      const msg = new window.Paho.MQTT.Message(
        typeof payload === 'string' ? payload : JSON.stringify(payload)
      )
      msg.destinationName = topic
      client.send(msg)
      return true
    } catch { return false }
  }

  return { connect, disconnect, subscribe, publish, client }
}
