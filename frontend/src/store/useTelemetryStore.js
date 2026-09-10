import { create } from 'zustand';

const initialTelemetry = {
  timestamp: Date.now() / 1000,
  rpm: 0,
  chts: [100, 100, 100, 100],
  egts: [200, 200, 200, 200],
  oilPressure: 4.5,
  oilTemp: 80.0,
  crankcasePressure: 1.0,
  hydPressure: 3000.0,
  hydTemp: 40.0,
  avionicsTemp: 30.0,
  batteryVoltage: 24.0,
  batteryAmps: 12.0,
  generatorLoad: 45.0,
  turboBoostPressure: 0.0,
  intercoolerTemp: 30.0,
  ambientTemp: 15.0,
  ambientPressure: 1013.25,
  densityAltitude: 1200.0,
  windSpeed: 14.5,
  windDir: 230,
  iceRisk: 0.05,
  pitchAngle: 2.1,
  rollAngle: -0.8,
  yawRate: 0.1,
  gLoad: 1.0,
  fuelLevelL: 50.0,
  fuelLevelR: 50.0,
  fuelUsedTotal: 0.0,
  anomalyScore: 0.04,
  rulHours: 1420.0,
  componentWear: {
    cyl1: 0.012,
    cyl2: 0.015,
    cyl3: 0.011,
    cyl4: 0.013,
    oilPump: 0.024,
    alternator: 0.018,
    turbo: 0.031,
    propGovernor: 0.015,
    bearings: 0.048,
    fuelPump: 0.022,
    hydraulics: 0.019,
    avionics: 0.009
  },
  faults: {
    cyl2Overheat: false,
    oilLineRupture: false,
    mainBearingWear: false,
    propGovernorFail: false,
    carbIcingEvent: false,
    alternatorFailure: false,
    coolantLeakMajor: false,
    propStrike: false,
    hydLeak: false,
    avionicsOverheat: false,
  },
  actuators: {
    throttle: 0,
    mixture: 50,
    propPitch: 100,
    fuelSelector: 'BOTH',
    carbHeat: false,
    antiIce: false,
    generatorSwitch: true,
    autopilot: false,
    flaps: 0,
    gearDown: true,
    avionicsFan: true,
    hydPump: true,
  }
};

export const useTelemetryStore = create((set, get) => ({
  connected: false,
  latency: 0,
  telemetry: initialTelemetry,
  sessionFrames: [],
  alarmLog: [
    {
      id: 'init-0',
      timestamp: Date.now() - 120000,
      message: 'FADEC System initialized in NOMINAL mode',
      severity: 'INFO',
      component: 'FADEC / MAIN BUS'
    },
    {
      id: 'init-1',
      timestamp: Date.now() - 90000,
      message: 'MIL-STD-1553 Avionics Data Bus Synchronized',
      severity: 'INFO',
      component: 'AVIONICS DATA BUS'
    },
    {
      id: 'init-2',
      timestamp: Date.now() - 45000,
      message: 'All 4 Cylinder Head Temperature probes calibrated',
      severity: 'INFO',
      component: 'CYLINDER THERMAL BANK'
    }
  ],
  activePanel: 0,
  
  setConnected: (status) => set({ connected: status }),
  setLatency: (ms) => set({ latency: ms }),
  
  updateTelemetry: (data) => {
    const prev = get().telemetry;
    const now = Date.now();
    const newAlarms = [];

    // Trigger alarms on threshold crossings
    if (prev) {
      // Oil Pressure critical drop
      if (data.oilPressure < 1.5 && prev.oilPressure >= 1.5) {
        newAlarms.push({
          id: `oil-${now}`,
          timestamp: now,
          message: `Critical Oil Pressure droop detected (${data.oilPressure.toFixed(2)} BAR)`,
          severity: 'CRITICAL',
          component: 'LUBRICATION PUMP'
        });
      }
      // Cylinder 2 Overheat
      if (data.chts[1] > 230 && prev.chts[1] <= 230) {
        newAlarms.push({
          id: `c2-${now}`,
          timestamp: now,
          message: `Cylinder 2 Thermal Runaway alert (${data.chts[1].toFixed(1)} °C)`,
          severity: 'CRITICAL',
          component: 'CYLINDER 2 HEAD'
        });
      }
      // Alternator / Battery drop
      if (data.batteryVoltage < 22.0 && prev.batteryVoltage >= 22.0) {
        newAlarms.push({
          id: `bat-${now}`,
          timestamp: now,
          message: `28V Main Bus undervoltage (${data.batteryVoltage.toFixed(1)} V)`,
          severity: 'WARNING',
          component: 'ELECTRICAL POWER BUS'
        });
      }
      // Hydraulic Pressure
      if (data.hydPressure < 1800 && prev.hydPressure >= 1800) {
        newAlarms.push({
          id: `hyd-${now}`,
          timestamp: now,
          message: `Hydraulic surface line pressure loss (${data.hydPressure.toFixed(0)} PSI)`,
          severity: 'CRITICAL',
          component: 'HYDRAULIC POWER UNIT'
        });
      }
    }

    set((state) => {
      const updatedFrames = [...state.sessionFrames, data];
      if (updatedFrames.length > 500) updatedFrames.shift();

      const updatedAlarms = newAlarms.length > 0
        ? [...newAlarms, ...state.alarmLog].slice(0, 150)
        : state.alarmLog;

      return {
        telemetry: data,
        sessionFrames: updatedFrames,
        alarmLog: updatedAlarms
      };
    });
  },
  
  addAlarm: (alarm) => set((state) => ({
    alarmLog: [{ ...alarm, id: Math.random().toString(36).substring(7), timestamp: Date.now() }, ...state.alarmLog].slice(0, 150)
  })),

  clearAlarms: () => set({ alarmLog: [] }),
  setActivePanel: (index) => set({ activePanel: index }),
}));
