import { create } from "zustand";
import type {
  Device,
  DeviceExtras,
  Sensor,
  AutomationRule,
  Schedule,
  ActivityLog,
  ChatMessage,
  CvState,
  UserSettings,
} from "@/types";

interface AppState {
  // Devices
  devices: Record<string, Device>;
  deviceStates: Record<string, boolean>;
  deviceExtras: Record<string, DeviceExtras>;
  deviceOnAt: Record<string, number>;

  // Sensors
  sensors: Record<string, Sensor>;
  sensorData: Record<string, number | null>;
  sensorHistory: Record<string, { val: number; ts: number }[]>;

  // Automation
  automationRules: Record<string, AutomationRule[]>;
  schedules: Schedule[];

  // Logs
  logs: ActivityLog[];
  logTypeFilter: string;
  logSearchFilter: string;

  // MQTT
  mqttConnected: boolean;

  // Camera
  cameraActive: boolean;

  // CV
  cv: CvState;

  // Chat
  chatMessages: ChatMessage[];

  // Settings
  quickControls: string[];

  // Session
  sessionStart: number;

  // Actions
  setDevices: (devices: Device[]) => void;
  setDeviceState: (id: string, state: boolean) => void;
  setDeviceExtras: (id: string, extras: Partial<DeviceExtras>) => void;
  setSensors: (sensors: Sensor[]) => void;
  setSensorData: (id: string, value: number | null) => void;
  addSensorHistory: (id: string, val: number) => void;
  setAutomationRules: (rules: Record<string, AutomationRule[]>) => void;
  setSchedules: (schedules: Schedule[]) => void;
  setLogs: (logs: ActivityLog[]) => void;
  addLog: (log: ActivityLog) => void;
  setLogFilter: (type: string) => void;
  setLogSearch: (q: string) => void;
  setMqttConnected: (connected: boolean) => void;
  setCameraActive: (active: boolean) => void;
  setCv: (cv: Partial<CvState>) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setQuickControls: (ids: string[]) => void;
  removeDevice: (id: string) => void;
  removeSensor: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  devices: {},
  deviceStates: {},
  deviceExtras: {},
  deviceOnAt: {},
  sensors: {},
  sensorData: {},
  sensorHistory: {},
  automationRules: {},
  schedules: [],
  logs: [],
  logTypeFilter: "all",
  logSearchFilter: "",
  mqttConnected: false,
  cameraActive: false,
  cv: {
    isActive: false,
    modelLoaded: false,
    personCount: 0,
    brightness: 0,
    lightCondition: "unknown",
  },
  chatMessages: [],
  quickControls: [],
  sessionStart: Date.now(),

  // Actions
  setDevices: (devices) =>
    set((state) => {
      const map: Record<string, Device> = {};
      const states: Record<string, boolean> = {};
      const extras: Record<string, DeviceExtras> = {};
      devices.forEach((d) => {
        const id = String(d.id);
        map[id] = d;
        if (state.deviceStates[id] === undefined)
          states[id] = Boolean(d.lastState);
        if (!state.deviceExtras[id])
          extras[id] = {
            fanSpeed: 50,
            acMode: "cool",
            acTemp: 24,
            brightness: 100,
            volume: 60,
          };
      });
      return {
        devices: { ...state.devices, ...map },
        deviceStates: { ...state.deviceStates, ...states },
        deviceExtras: { ...state.deviceExtras, ...extras },
      };
    }),

  setDeviceState: (id, deviceState) =>
    set((state) => ({
      deviceStates: { ...state.deviceStates, [id]: deviceState },
      deviceOnAt: deviceState
        ? { ...state.deviceOnAt, [id]: Date.now() }
        : (() => {
            const { [id]: _, ...rest } = state.deviceOnAt;
            return rest;
          })(),
    })),

  setDeviceExtras: (id, extras) =>
    set((state) => ({
      deviceExtras: {
        ...state.deviceExtras,
        [id]: { ...state.deviceExtras[id], ...extras },
      },
    })),

  setSensors: (sensors) =>
    set((state) => {
      const map: Record<string, Sensor> = {};
      const data: Record<string, number | null> = {};
      const history: Record<string, { val: number; ts: number }[]> = {};
      sensors.forEach((s) => {
        const id = String(s.id);
        map[id] = s;
        if (state.sensorData[id] === undefined) data[id] = null;
        if (!state.sensorHistory[id]) history[id] = [];
      });
      return {
        sensors: { ...state.sensors, ...map },
        sensorData: { ...state.sensorData, ...data },
        sensorHistory: { ...state.sensorHistory, ...history },
      };
    }),

  setSensorData: (id, value) =>
    set((state) => ({
      sensorData: { ...state.sensorData, [id]: value },
    })),

  addSensorHistory: (id, val) =>
    set((state) => {
      const history = [...(state.sensorHistory[id] || []), { val, ts: Date.now() }];
      if (history.length > 30) history.shift();
      return { sensorHistory: { ...state.sensorHistory, [id]: history } };
    }),

  setAutomationRules: (rules) => set({ automationRules: rules }),
  setSchedules: (schedules) => set({ schedules }),

  setLogs: (logs) => set({ logs }),

  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 500),
    })),

  setLogFilter: (type) => set({ logTypeFilter: type }),
  setLogSearch: (q) => set({ logSearchFilter: q }),

  setMqttConnected: (connected) => set({ mqttConnected: connected }),
  setCameraActive: (active) => set({ cameraActive: active }),

  setCv: (cv) => set((state) => ({ cv: { ...state.cv, ...cv } })),

  setChatMessages: (msgs) => set({ chatMessages: msgs }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),

  setQuickControls: (ids) => set({ quickControls: ids }),

  removeDevice: (id) =>
    set((state) => {
      const { [id]: _, ...devRest } = state.devices;
      const { [id]: __, ...stateRest } = state.deviceStates;
      const { [id]: ___, ...extrasRest } = state.deviceExtras;
      const { [id]: ____, ...onAtRest } = state.deviceOnAt;
      return {
        devices: devRest,
        deviceStates: stateRest,
        deviceExtras: extrasRest,
        deviceOnAt: onAtRest,
        quickControls: state.quickControls.filter((x) => x !== id),
      };
    }),

  removeSensor: (id) =>
    set((state) => {
      const { [id]: _, ...senRest } = state.sensors;
      const { [id]: __, ...dataRest } = state.sensorData;
      const { [id]: ___, ...histRest } = state.sensorHistory;
      return {
        sensors: senRest,
        sensorData: dataRest,
        sensorHistory: histRest,
      };
    }),
}));
