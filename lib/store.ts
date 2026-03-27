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
} from "@/types";

// ─── 1. DEVICE SLICE ───
interface DeviceSlice {
  devices: Record<string, Device>;
  deviceStates: Record<string, boolean>;
  deviceExtras: Record<string, DeviceExtras>;
  deviceOnAt: Record<string, number>;
  quickControls: string[];
  
  setDevices: (devices: Device[]) => void;
  setDeviceState: (id: string, state: boolean) => void;
  setDeviceExtras: (id: string, extras: Partial<DeviceExtras>) => void;
  setQuickControls: (ids: string[]) => void;
  removeDevice: (id: string) => void;
}

const createDeviceSlice = (set: any): DeviceSlice => ({
  devices: {},
  deviceStates: {},
  deviceExtras: {},
  deviceOnAt: {},
  quickControls: [],

  setDevices: (devices) =>
    set((state: any) => {
      const map: Record<string, Device> = {};
      const states: Record<string, boolean> = {};
      const extras: Record<string, DeviceExtras> = {};
      devices.forEach((d) => {
        const id = String(d.id);
        map[id] = d;
        if (state.deviceStates[id] === undefined) states[id] = Boolean(d.lastState);
        if (!state.deviceExtras[id]) {
          extras[id] = { fanSpeed: 50, acMode: "cool", acTemp: 24, brightness: 100, volume: 60 };
        }
      });
      return {
        devices: { ...state.devices, ...map },
        deviceStates: { ...state.deviceStates, ...states },
        deviceExtras: { ...state.deviceExtras, ...extras },
      };
    }),

  setDeviceState: (id, deviceState) =>
    set((state: any) => ({
      deviceStates: { ...state.deviceStates, [id]: deviceState },
      deviceOnAt: deviceState
        ? { ...state.deviceOnAt, [id]: Date.now() }
        : (() => { const { [id]: _, ...rest } = state.deviceOnAt; return rest; })(),
    })),

  setDeviceExtras: (id, extras) =>
    set((state: any) => ({
      deviceExtras: { ...state.deviceExtras, [id]: { ...state.deviceExtras[id], ...extras } },
    })),

  setQuickControls: (ids) => set({ quickControls: ids }),

  removeDevice: (id) =>
    set((state: any) => {
      const { [id]: _, ...devRest } = state.devices;
      const { [id]: __, ...stateRest } = state.deviceStates;
      const { [id]: ___, ...extrasRest } = state.deviceExtras;
      const { [id]: ____, ...onAtRest } = state.deviceOnAt;
      return {
        devices: devRest,
        deviceStates: stateRest,
        deviceExtras: extrasRest,
        deviceOnAt: onAtRest,
        quickControls: state.quickControls.filter((x: string) => x !== id),
      };
    }),
});

// ─── 2. SENSOR SLICE ───
interface SensorSlice {
  sensors: Record<string, Sensor>;
  sensorData: Record<string, number | null>;
  sensorHistory: Record<string, { val: number; ts: number }[]>;

  setSensors: (sensors: Sensor[]) => void;
  setSensorData: (id: string, value: number | null) => void;
  addSensorHistory: (id: string, val: number) => void;
  removeSensor: (id: string) => void;
}

const createSensorSlice = (set: any): SensorSlice => ({
  sensors: {},
  sensorData: {},
  sensorHistory: {},

  setSensors: (sensors) =>
    set((state: any) => {
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

  setSensorData: (id, value) => set((state: any) => ({ sensorData: { ...state.sensorData, [id]: value } })),

  addSensorHistory: (id, val) =>
    set((state: any) => {
      const history = [...(state.sensorHistory[id] || []), { val, ts: Date.now() }];
      if (history.length > 30) history.shift();
      return { sensorHistory: { ...state.sensorHistory, [id]: history } };
    }),

  removeSensor: (id) =>
    set((state: any) => {
      const { [id]: _, ...senRest } = state.sensors;
      const { [id]: __, ...dataRest } = state.sensorData;
      const { [id]: ___, ...histRest } = state.sensorHistory;
      return { sensors: senRest, sensorData: dataRest, sensorHistory: histRest };
    }),
});

// ─── 3. UI & LOGS SLICE ───
interface UISlice {
  logs: ActivityLog[];
  logTypeFilter: string;
  logSearchFilter: string;
  mqttConnected: boolean;
  cameraActive: boolean;
  cv: CvState;
  chatMessages: ChatMessage[];
  automationRules: Record<string, AutomationRule[]>;
  schedules: Schedule[];
  sessionStart: number;

  setLogs: (logs: ActivityLog[]) => void;
  addLog: (log: ActivityLog) => void;
  setLogFilter: (type: string) => void;
  setLogSearch: (q: string) => void;
  setMqttConnected: (connected: boolean) => void;
  setCameraActive: (active: boolean) => void;
  setCv: (cv: Partial<CvState>) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setAutomationRules: (rules: Record<string, AutomationRule[]>) => void;
  setSchedules: (schedules: Schedule[]) => void;
}

const createUISlice = (set: any): UISlice => ({
  logs: [],
  logTypeFilter: "all",
  logSearchFilter: "",
  mqttConnected: false,
  cameraActive: false,
  cv: { isActive: false, modelLoaded: false, personCount: 0, brightness: 0, lightCondition: "unknown" },
  chatMessages: [],
  automationRules: {},
  schedules: [],
  sessionStart: Date.now(),

  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state: any) => ({ logs: [log, ...state.logs].slice(0, 500) })),
  setLogFilter: (type) => set({ logTypeFilter: type }),
  setLogSearch: (q) => set({ logSearchFilter: q }),
  setMqttConnected: (connected) => set({ mqttConnected: connected }),
  setCameraActive: (active) => set({ cameraActive: active }),
  setCv: (cv) => set((state: any) => ({ cv: { ...state.cv, ...cv } })),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  addChatMessage: (msg) => set((state: any) => ({ chatMessages: [...state.chatMessages, msg] })),
  setAutomationRules: (rules) => set({ automationRules: rules }),
  setSchedules: (schedules) => set({ schedules }),
});

// ─── COMBINED STORE EXPORT ───
export type AppState = DeviceSlice & SensorSlice & UISlice;

export const useAppStore = create<AppState>((...a) => ({
  ...createDeviceSlice(...a),
  ...createSensorSlice(...a),
  ...createUISlice(...a),
}));
