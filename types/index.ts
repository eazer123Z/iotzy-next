// ─── Device Types ───
export interface Device {
  id: number;
  deviceKey: string;
  name: string;
  icon: string;
  type: string;
  topicSub: string | null;
  topicPub: string | null;
  isActive: boolean;
  lastState: number;
  latestState: number;
  lastSeen: string | null;
  lastStateChanged: string | null;
}

export interface DeviceExtras {
  fanSpeed: number;
  acMode: string;
  acTemp: number;
  brightness: number;
  volume: number;
}

// ─── Sensor Types ───
export interface Sensor {
  id: number;
  sensorKey: string;
  name: string;
  type: string;
  icon: string;
  unit: string | null;
  topic: string;
  latestValue: number | null;
  lastSeen: string | null;
}

export interface SensorReading {
  value: number;
  recordedAt: string;
}

// ─── Automation Types ───
export interface AutomationRule {
  id: number;
  sensorId: number | null;
  deviceId: number;
  conditionType: string;
  threshold: number | null;
  thresholdMin: number | null;
  thresholdMax: number | null;
  action: string;
  delayMs: number;
  startTime: string | null;
  endTime: string | null;
  days: number[] | null;
  isEnabled: boolean;
  fromTemplate: string | null;
  sensorName?: string;
  sensorType?: string;
  deviceName?: string;
  deviceIcon?: string;
}

export interface Schedule {
  id: number;
  userId: number;
  label: string | null;
  timeHhmm: string;
  time: string;
  days: number[] | null;
  action: string;
  devices: number[] | null;
  isEnabled: boolean;
  enabled: boolean;
  createdAt: string;
}

// ─── Log Types ───
export interface ActivityLog {
  id: number;
  deviceName: string;
  activity: string;
  triggerType: string;
  logType: "info" | "success" | "warning" | "error";
  createdAt: string;
}

// ─── AI Chat Types ───
export interface ChatMessage {
  id?: number;
  sender: "user" | "bot";
  message: string;
  platform: string;
  createdAt?: string;
}

export interface AIResponse {
  responseText: string;
  intent: string;
  uiAction: string;
  actions: AIAction[];
}

export interface AIAction {
  type: string;
  [key: string]: unknown;
}

// ─── CV Types ───
export interface CvState {
  isActive: boolean;
  modelLoaded: boolean;
  personCount: number;
  brightness: number;
  lightCondition: string;
}

export interface CvRules {
  human: {
    enabled: boolean;
    rules: CvHumanRule[];
    delay: number;
  };
  light: {
    enabled: boolean;
    onDark: number[];
    onBright: number[];
    delay: number;
  };
}

export interface CvHumanRule {
  id: string;
  condition: string;
  count: number;
  devices: string[];
  onTrue: string;
  onFalse: string;
  delay: number;
}

// ─── Settings Types ───
export interface UserSettings {
  mqttBroker: string | null;
  mqttPort: number | null;
  mqttUseSsl: boolean | null;
  mqttUsername: string | null;
  mqttPath: string | null;
  mqttClientId: string | null;
  telegramChatId: string | null;
  automationLamp: boolean | null;
  automationFan: boolean | null;
  automationLock: boolean | null;
  lampOnThreshold: number | null;
  lampOffThreshold: number | null;
  fanTempHigh: number | null;
  fanTempNormal: number | null;
  lockDelay: number | null;
  theme: string | null;
  quickControlDevices: number[] | null;
  cvMinConfidence: number | null;
  cvDarkThreshold: number | null;
  cvBrightThreshold: number | null;
  cvHumanRulesEnabled: boolean | null;
  cvLightRulesEnabled: boolean | null;
}

// ─── MQTT Types ───
export interface MqttTemplate {
  id: number;
  name: string;
  slug: string;
  broker: string;
  port: number;
  useSsl: boolean;
  username: string | null;
  path: string | null;
  description: string | null;
}

// ─── Dashboard Types ───
export interface DashboardData {
  devices: Device[];
  sensors: Sensor[];
  cvState: CvState | null;
  stats: {
    totalDevices: number;
    activeDevices: number;
    totalSensors: number;
    onlineSensors: number;
  };
}

// ─── Sensor Config ───
export interface SensorConfig {
  icon: string;
  color: string;
  min?: number;
  max?: number;
  unit: string;
  barClass: string;
  gaugeColor: string;
}

// ─── Device Type Helpers ───
export type DeviceType = "light" | "fan" | "ac" | "tv" | "lock" | "door" | "cctv" | "speaker" | "switch" | "pump";
