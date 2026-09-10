import React, { useState, useRef, useEffect } from 'react';
import { Bell, Activity, Wifi, WifiOff, Clock, MapPin, Cpu, ShieldAlert, AlertTriangle, Info, Trash2, ArrowRight, X } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { twMerge } from 'tailwind-merge';

export function GlobalHeader() {
  const { connected, latency, alarmLog, telemetry, clearAlarms, setActivePanel } = useTelemetryStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  const unreadAlarms = alarmLog.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING').length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleJumpToLogs = () => {
    setActivePanel(4); // Switch to Logs Tab
    setShowDropdown(false);
  };

  return (
    <header className="h-[50px] bg-gray-950/95 backdrop-blur-md border-b border-holo/20 flex items-center justify-between px-4 text-xs font-mono select-none shrink-0 z-40 relative">
      {/* Left: Callout & Position */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center space-x-2 text-holo">
          <Activity size={16} className={connected ? "animate-pulse text-holo" : "text-gray-500"} />
          <span className="font-bold tracking-widest text-xs sm:text-sm">UAV-TWIN // P1</span>
        </div>
        
        <div className="hidden md:block h-4 w-px bg-holo/20" />
        
        <div className="hidden md:flex items-center space-x-1.5 text-gray-400 text-[11px]">
          <MapPin size={13} className="text-holo/70" />
          <span>34° 01' 42" N, 118° 15' 20" W</span>
        </div>
      </div>

      {/* Center / Right: Telemetry Health, Link, Clock, Alarms */}
      <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
        {/* Quick Health Index */}
        {telemetry && (
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] bg-gray-900/60 px-2.5 py-1 rounded border border-holo/20">
            <Cpu size={13} className="text-holo" />
            <span className="text-gray-400">AI HEALTH:</span>
            <span className={`font-bold ${telemetry.anomalyScore > 0.5 ? 'text-plasma' : telemetry.anomalyScore > 0.2 ? 'text-amber-400' : 'text-holo'}`}>
              {((1 - (telemetry.anomalyScore || 0.04)) * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Connection Pill */}
        <div className={twMerge(
          "flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] border shrink-0",
          connected ? "border-holo/40 text-holo bg-holo/10" : "border-plasma/40 text-plasma bg-plasma/10"
        )}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{connected ? `LINK ${latency}ms` : 'LINK LOST'}</span>
        </div>

        {/* Mission Clock */}
        <div className="hidden sm:flex items-center space-x-1.5 text-gray-300 text-[11px]">
          <Clock size={13} className="text-holo/80" />
          <span>Z 14:32:08</span>
        </div>

        {/* Interactive Alarms Bell with Dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1.5 rounded hover:bg-gray-800/80 transition-colors focus:outline-none relative group"
            title="Telemetry Alarms & Notifications"
          >
            <Bell size={18} className={unreadAlarms > 0 ? "text-plasma animate-pulse drop-shadow-[0_0_8px_#ff003c]" : "text-holo hover:text-white"} />
            {unreadAlarms > 0 && (
              <div className="absolute -top-1 -right-1 bg-plasma text-gray-950 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-[0_0_8px_#ff003c]">
                {unreadAlarms > 9 ? '9+' : unreadAlarms}
              </div>
            )}
          </button>

          {/* Holographic Alarms Tray Dropdown */}
          {showDropdown && (
            <div className="absolute top-10 right-0 w-80 sm:w-96 bg-gray-950/95 backdrop-blur-xl border border-holo/40 rounded-sm shadow-[0_0_30px_rgba(0,240,255,0.25)] p-3 z-50 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-holo/20 mb-2">
                <span className="text-holo font-bold flex items-center space-x-1 text-[11px]">
                  <Bell size={13} className="text-holo" />
                  <span>ACTIVE NOTIFICATION TRAY ({alarmLog.length})</span>
                </span>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={clearAlarms}
                    className="text-gray-400 hover:text-plasma transition-colors"
                    title="Clear notifications"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button 
                    onClick={() => setShowDropdown(false)}
                    className="text-gray-400 hover:text-holo transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Alarm List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {alarmLog.slice(0, 8).map((alarm) => (
                  <div 
                    key={alarm.id}
                    className={`p-2 rounded border text-[11px] flex flex-col gap-1 ${
                      alarm.severity === 'CRITICAL' ? 'bg-plasma/15 border-plasma text-plasma' :
                      alarm.severity === 'WARNING' ? 'bg-amber-400/10 border-amber-400/50 text-amber-300' :
                      'bg-gray-900/60 border-holo/20 text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold uppercase flex items-center space-x-1">
                        {alarm.severity === 'CRITICAL' && <ShieldAlert size={11} className="text-plasma" />}
                        {alarm.severity === 'WARNING' && <AlertTriangle size={11} className="text-amber-400" />}
                        {alarm.severity === 'INFO' && <Info size={11} className="text-holo" />}
                        <span>{alarm.component}</span>
                      </span>
                      <span className="opacity-70">{new Date(alarm.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="opacity-95 leading-tight">{alarm.message}</p>
                  </div>
                ))}

                {alarmLog.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-xs italic">
                    NO UNREAD NOTIFICATIONS
                  </div>
                )}
              </div>

              {/* Footer Jump Button */}
              <div className="pt-2 border-t border-holo/20 mt-2">
                <button
                  onClick={handleJumpToLogs}
                  className="w-full py-1.5 bg-holo/15 hover:bg-holo/30 border border-holo/40 text-holo text-[11px] font-bold rounded flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <span>OPEN FULL MISSION LOGS</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
