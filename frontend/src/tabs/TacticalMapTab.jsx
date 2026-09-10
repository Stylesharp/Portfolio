import React, { useEffect, useState } from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';
import { Navigation, Target, MapPin } from 'lucide-react';

export function TacticalMapTab() {
  const { telemetry } = useTelemetryStore();
  const [sweep, setSweep] = useState(0);

  useEffect(() => {
    let animationFrame;
    const animate = () => {
      setSweep((prev) => (prev + 1) % 360);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  if (!telemetry) {
    return <div className="text-holo p-4 font-mono animate-pulse">AWAITING SPATIAL DATA...</div>;
  }

  // Base coordinates (San Francisco approx, matches server.py init)
  const BASE_LAT = 37.7749;
  const BASE_LON = -122.4194;

  const lat = telemetry.latitude || BASE_LAT;
  const lon = telemetry.longitude || BASE_LON;
  const heading = telemetry.heading || 0;
  const speed = telemetry.groundSpeed || 0;
  const alt = telemetry.densityAltitude || 0;

  // Convert lat/lon diff to pixels (Arbitrary scale for visual purposes)
  // 1 degree lat approx 111km. Let's scale it so movement is visible.
  // In server.py: self.latitude += (self.groundSpeed * 0.0000005) ...
  const scale = 100000; 
  const x = (lon - BASE_LON) * scale;
  const y = -(lat - BASE_LAT) * scale; // Invert Y because SVG Y goes down

  return (
    <div className="flex flex-col gap-4 font-mono select-none h-full">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[120px]">
        <HoloPanel title="COORDINATES" className="md:col-span-1 flex flex-col justify-center">
          <div className="text-holo text-lg font-bold">LAT: {lat.toFixed(6)}°</div>
          <div className="text-holo text-lg font-bold">LON: {lon.toFixed(6)}°</div>
          <div className="text-gray-400 text-xs mt-2">WGS84 DATUM</div>
        </HoloPanel>
        
        <HoloPanel title="VECTOR" className="md:col-span-2 flex flex-row items-center justify-around">
          <div className="text-center">
            <div className="text-gray-400 text-xs">GROUND SPEED</div>
            <div className="text-holo text-2xl font-bold">{speed.toFixed(1)} <span className="text-sm">KTS</span></div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs">HEADING</div>
            <div className="text-holo text-2xl font-bold">{heading.toFixed(0).padStart(3, '0')}°</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs">ALTITUDE</div>
            <div className="text-holo text-2xl font-bold">{alt.toFixed(0)} <span className="text-sm">FT</span></div>
          </div>
        </HoloPanel>

        <HoloPanel title="LINK STATUS" className="md:col-span-1 flex flex-col justify-center items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">SATCOM</span>
            <span className="text-xs text-plasma font-bold">ENCRYPTED</span>
          </div>
          <div className="w-full bg-gray-900 h-2 rounded overflow-hidden border border-holo/30">
            <div className="bg-holo h-full w-[94%]" />
          </div>
          <div className="w-full text-right text-[9px] text-holo mt-1">94% SIG STRENGTH</div>
        </HoloPanel>
      </div>

      <HoloPanel title="TACTICAL GEOSPATIAL RADAR" className="flex-1 min-h-[400px]">
        <div className="w-full h-full relative bg-gray-950/80 rounded border border-holo/20 overflow-hidden flex items-center justify-center">
          
          <svg viewBox="-500 -500 1000 1000" className="w-full h-full max-h-[70vh] shadow-[inset_0_0_50px_rgba(0,240,255,0.1)]">
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.15" />
                <stop offset="80%" stopColor="#00f0ff" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Radar Background */}
            <circle cx="0" cy="0" r="480" fill="url(#radarGlow)" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="0" cy="0" r="360" fill="none" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="5,5" />
            <circle cx="0" cy="0" r="240" fill="none" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="5,5" />
            <circle cx="0" cy="0" r="120" fill="none" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="5,5" />
            
            {/* Crosshairs */}
            <line x1="-500" y1="0" x2="500" y2="0" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="0" y1="-500" x2="0" y2="500" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.3" />

            {/* Home Base Marker */}
            <g transform="translate(0,0)">
              <circle cx="0" cy="0" r="8" fill="none" stroke="#facc15" strokeWidth="2" />
              <circle cx="0" cy="0" r="2" fill="#facc15" />
              <text x="12" y="4" fill="#facc15" fontSize="14">GCS HOME</text>
            </g>

            {/* Radar Sweep */}
            <g transform={`rotate(${sweep})`}>
              <path d="M 0 0 L 0 -480 A 480 480 0 0 1 124.2 -463.6 Z" fill="url(#sweepGrad)" opacity="0.5" />
              <line x1="0" y1="0" x2="124.2" y2="-463.6" stroke="#00f0ff" strokeWidth="2" />
            </g>

            {/* UAV Blip & Trail */}
            <g transform={`translate(${x}, ${y})`}>
              {/* Ping Animation */}
              <circle cx="0" cy="0" r="15" fill="none" stroke="#ff003c" strokeWidth="2">
                <animate attributeName="r" values="0; 25" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1; 0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              
              {/* UAV Icon (rotates with heading) */}
              <g transform={`rotate(${heading})`}>
                <path d="M 0 -15 L 10 10 L 0 5 L -10 10 Z" fill="#ff003c" />
                {/* Thrust flame */}
                <path d="M -3 6 L 0 14 L 3 6 Z" fill="#facc15" />
              </g>
              
              {/* Label */}
              <text x="15" y="-15" fill="#ff003c" fontSize="16" fontWeight="bold">UAV-01</text>
              <text x="15" y="2" fill="#0ea5e9" fontSize="12">FL{(alt/100).toFixed(0)}</text>
              <text x="15" y="16" fill="#0ea5e9" fontSize="12">GS{speed.toFixed(0)}</text>
            </g>
          </svg>

        </div>
      </HoloPanel>
    </div>
  );
}
