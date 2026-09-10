import React from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function AlarmFeed() {
  const { alarmLog } = useTelemetryStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        <AnimatePresence>
          {alarmLog.map((alarm) => (
            <motion.div
              key={alarm.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={twMerge(
                "p-2 border-l-2 text-xs font-mono bg-gray-900/50 backdrop-blur flex flex-col gap-1",
                alarm.severity === 'CRITICAL' ? 'border-plasma text-plasma' :
                alarm.severity === 'WARNING' ? 'border-amber-400 text-amber-400' :
                'border-holo text-holo'
              )}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold tracking-widest">{alarm.component}</span>
                <span className="opacity-70">{new Date(alarm.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="opacity-90">{alarm.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {alarmLog.length === 0 && (
          <div className="text-gray-500 font-mono text-xs italic text-center py-4">
            NO ACTIVE ALARMS
          </div>
        )}
      </div>
    </div>
  );
}
