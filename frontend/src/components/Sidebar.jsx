import React, { useState } from 'react';
import { LayoutDashboard, Box, BrainCircuit, Sliders, ScrollText, CloudFog, Map, Compass, Crosshair } from 'lucide-react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const TABS = [
  { icon: LayoutDashboard, label: 'Live Telemetry' },
  { icon: Box, label: '3D Digital Twin' },
  { icon: BrainCircuit, label: 'AI Prognostics' },
  { icon: Sliders, label: 'H.I.L Simulator' },
  { icon: ScrollText, label: 'Logs & Reliability' },
  { icon: CloudFog, label: 'Atmospheric' },
  { icon: Map, label: 'Mission Planning' },
  { icon: Compass, label: 'Flight Dynamics' },
  { icon: Crosshair, label: 'Tactical Radar' },
];

export function Sidebar() {
  const { activePanel, setActivePanel } = useTelemetryStore();
  const [hovered, setHovered] = useState(false);

  return (
    <aside 
      className={twMerge(
        "h-full bg-gray-950/80 backdrop-blur-lg border-r border-holo/20 transition-all duration-300 flex flex-col z-30 pointer-events-auto",
        hovered ? "w-[220px]" : "w-[72px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 py-4 flex flex-col gap-2">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activePanel === idx;
          return (
            <button
              key={idx}
              onClick={() => setActivePanel(idx)}
              className={twMerge(
                "relative flex items-center h-12 px-6 transition-colors duration-200 outline-none group",
                isActive ? "text-holo bg-holo/5" : "text-gray-500 hover:text-holo/80 hover:bg-gray-900"
              )}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-holo shadow-[0_0_8px_#00f0ff]" />
              )}
              
              <Icon size={22} className={twMerge("shrink-0", isActive && "drop-shadow-[0_0_5px_#00f0ff]")} />
              
              <span className={twMerge(
                "ml-4 font-mono text-xs uppercase whitespace-nowrap tracking-wider transition-opacity duration-300",
                hovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Footer Info */}
      <div className={twMerge(
        "p-4 border-t border-holo/20 transition-opacity duration-300 overflow-hidden font-mono text-[10px] text-gray-500 whitespace-nowrap",
        hovered ? "opacity-100 h-24" : "opacity-0 h-0 p-0 border-transparent"
      )}>
        <p>SECURE LINK <span className="text-holo">ESTABLISHED</span></p>
        <p>ENCRYPTION: AES-256</p>
        <p>v2.4.1.99</p>
      </div>
    </aside>
  );
}
