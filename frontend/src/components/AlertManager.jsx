import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';

export function AlertManager({ sendCommand }) {
  const { telemetry } = useTelemetryStore();
  const [criticalAlert, setCriticalAlert] = useState(null);
  const dismissedAlerts = useRef(new Set());

  useEffect(() => {
    if (!telemetry) return;

    let newAlert = null;

    if (telemetry.faults.oilLineRupture || telemetry.oilPressure < 1.0) {
      newAlert = {
        id: 'OIL_RUPTURE',
        title: 'CRITICAL SYSTEM DAMAGE',
        component: 'LUBRICATION SYSTEM',
        reading: `OIL PRESSURE: ${telemetry.oilPressure.toFixed(2)} BAR`,
        copilot: [
          '1. Throttle down to 25% immediately.',
          '2. Prepare for emergency engine shutdown.'
        ],
        action: 'AUTO-MITIGATE (THROTTLE 25%)',
        mitigateCommand: { type: 'setActuator', payload: { key: 'throttle', value: 25.0 } }
      };
    } else if (telemetry.faults.cyl2Overheat || telemetry.chts[1] > 240) {
      newAlert = {
        id: 'CYL2_OVERHEAT',
        title: 'THERMAL RUNAWAY DETECTED',
        component: 'CYLINDER 2 HEAD',
        reading: `CHT2: ${telemetry.chts[1].toFixed(1)} °C`,
        copilot: [
          '1. Enrichen mixture to max.',
          '2. Reduce throttle by 15%.'
        ],
        action: 'RICH MIXTURE & REDUCE PWR',
        mitigateCommand: { type: 'setActuator', payload: { key: 'mixture', value: 100.0 } }
      };
    } else if (telemetry.faults.alternatorFailure || telemetry.batteryVoltage < 22) {
      newAlert = {
        id: 'ELEC_FAIL',
        title: 'ELECTRICAL POWER LOSS',
        component: 'ALTERNATOR / MAIN BUS',
        reading: `BATTERY: ${telemetry.batteryVoltage.toFixed(1)} V`,
        copilot: [
          '1. Shed non-essential loads.',
          '2. Check generator switch.'
        ],
        action: 'SHED LOADS',
        mitigateCommand: { type: 'setActuator', payload: { key: 'antiIce', value: false } }
      };
    }

    if (newAlert) {
      if (!dismissedAlerts.current.has(newAlert.id)) {
         if (!criticalAlert || criticalAlert.id !== newAlert.id) {
            setCriticalAlert(newAlert);
         }
      }
    } else {
      // Clear dismissed alerts if the conditions return to nominal
      if (criticalAlert) setCriticalAlert(null);
      dismissedAlerts.current.clear();
    }
  }, [telemetry]);

  const handleMitigate = () => {
    if (criticalAlert?.mitigateCommand) {
      sendCommand(criticalAlert.mitigateCommand);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    if (criticalAlert) {
      dismissedAlerts.current.add(criticalAlert.id);
      setCriticalAlert(null);
    }
  };

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {criticalAlert && (
          <motion.div
            key={criticalAlert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: 50 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="w-[400px] bg-gray-900/95 backdrop-blur-md border border-plasma shadow-[0_0_30px_rgba(255,0,60,0.4)] rounded-sm overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="bg-plasma/20 p-3 border-b border-plasma flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="text-plasma animate-pulse shrink-0" size={24} />
                <div>
                  <h2 className="text-plasma font-mono font-bold text-sm tracking-widest uppercase">
                    {criticalAlert.title}
                  </h2>
                  <p className="text-plasma/80 font-mono text-[10px]">{criticalAlert.component} - {criticalAlert.reading}</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-plasma/60 hover:text-plasma transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 font-mono text-xs">
              <div className="mb-4">
                <div className="text-holo mb-1 text-[10px] uppercase tracking-widest flex items-center">
                  <ShieldCheck size={12} className="mr-1" /> AI Copilot Solutions
                </div>
                <div className="bg-gray-950 p-2 border border-holo/20 rounded">
                  {criticalAlert.copilot.map((step, i) => (
                    <p key={i} className="text-gray-300 mb-1">{step}</p>
                  ))}
                </div>
              </div>

              <button
                onClick={handleMitigate}
                className="w-full py-2 bg-plasma/20 hover:bg-plasma/40 border border-plasma text-plasma font-bold tracking-widest transition-colors shadow-[0_0_10px_rgba(255,0,60,0.2)] hover:shadow-[0_0_15px_rgba(255,0,60,0.4)]"
              >
                ACKNOWLEDGE & {criticalAlert.action}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
