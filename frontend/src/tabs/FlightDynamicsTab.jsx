import React from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';

export function FlightDynamicsTab() {
  const { telemetry } = useTelemetryStore();

  if (!telemetry) {
    return <div className="text-holo p-4 font-mono animate-pulse">AWAITING TELEMETRY...</div>;
  }

  // Extract variables
  const pitch = telemetry.pitchAngle || 0;
  const roll = telemetry.rollAngle || 0;
  const heading = telemetry.heading || 0;
  const speed = telemetry.groundSpeed || 0;
  const altitude = telemetry.densityAltitude || 0;

  // Viewport dimensions for the SVG PFD
  const V_WIDTH = 800;
  const V_HEIGHT = 600;
  const cx = V_WIDTH / 2;
  const cy = V_HEIGHT / 2;

  // Pitch translation (pixels per degree)
  const PITCH_FACTOR = 8; 
  const pitchOffset = pitch * PITCH_FACTOR;

  // Generate pitch ladder lines
  const pitchLines = [];
  for (let i = -60; i <= 60; i += 5) {
    if (i === 0) continue;
    const y = cy - i * PITCH_FACTOR;
    const isMajor = i % 10 === 0;
    const width = isMajor ? 120 : 60;
    
    pitchLines.push(
      <g key={i} transform={`translate(0, ${y})`}>
        <line x1={cx - width/2} y1={0} x2={cx + width/2} y2={0} stroke={i > 0 ? '#0ea5e9' : '#8b4513'} strokeWidth="3" />
        {isMajor && (
          <>
            <text x={cx - width/2 - 10} y={5} fill="#fff" fontSize="16" fontFamily="monospace" textAnchor="end">{Math.abs(i)}</text>
            <text x={cx + width/2 + 10} y={5} fill="#fff" fontSize="16" fontFamily="monospace" textAnchor="start">{Math.abs(i)}</text>
          </>
        )}
      </g>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-mono select-none h-full">
      <HoloPanel title="SYNTHETIC VISION / PRIMARY FLIGHT DISPLAY" className="flex-1">
        <div className="relative w-full h-full overflow-hidden bg-gray-950 rounded border border-holo/20 flex items-center justify-center">
          
          <svg viewBox={`0 0 ${V_WIDTH} ${V_HEIGHT}`} className="w-full h-full max-h-[80vh] shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <defs>
              <clipPath id="pfd-clip">
                <rect x="0" y="0" width={V_WIDTH} height={V_HEIGHT} rx="15" />
              </clipPath>
              
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9a3412" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>
            </defs>

            <g clipPath="url(#pfd-clip)">
              {/* Rotating/Pitching Horizon Group */}
              <g transform={`translate(${cx}, ${cy}) rotate(${-roll}) translate(${-cx}, ${-cy + pitchOffset})`}>
                {/* Sky */}
                <rect x={-V_WIDTH} y={-V_HEIGHT*2} width={V_WIDTH*3} height={V_HEIGHT*2 + cy} fill="url(#skyGrad)" />
                {/* Ground */}
                <rect x={-V_WIDTH} y={cy} width={V_WIDTH*3} height={V_HEIGHT*2} fill="url(#groundGrad)" />
                {/* Horizon Line */}
                <line x1={-V_WIDTH} y1={cy} x2={V_WIDTH*2} y2={cy} stroke="#fff" strokeWidth="4" />
                
                {/* Pitch Ladder */}
                {pitchLines}
              </g>

              {/* Static Overlays */}
              
              {/* Aircraft Symbol (Center) */}
              <g transform={`translate(${cx}, ${cy})`}>
                <path d="M -80 0 L -20 0 L -20 20 Z" fill="none" stroke="#facc15" strokeWidth="5" />
                <path d="M 80 0 L 20 0 L 20 20 Z" fill="none" stroke="#facc15" strokeWidth="5" />
                <circle cx="0" cy="0" r="5" fill="#facc15" />
              </g>

              {/* Speed Tape (Left) */}
              <rect x="20" y="50" width="80" height="500" fill="rgba(15, 23, 42, 0.7)" stroke="#00f0ff" strokeWidth="2" />
              <text x="60" y="40" fill="#00f0ff" fontSize="14" textAnchor="middle">SPD (KTS)</text>
              <g clipPath="url(#pfd-clip)">
                <text x="60" y={cy + 8} fill="#fff" fontSize="24" fontWeight="bold" textAnchor="middle">{Math.round(speed)}</text>
                <path d="M 90 290 L 110 300 L 90 310 Z" fill="#00f0ff" />
              </g>

              {/* Altimeter Tape (Right) */}
              <rect x={V_WIDTH - 100} y="50" width="80" height="500" fill="rgba(15, 23, 42, 0.7)" stroke="#00f0ff" strokeWidth="2" />
              <text x={V_WIDTH - 60} y="40" fill="#00f0ff" fontSize="14" textAnchor="middle">ALT (FT)</text>
              <g clipPath="url(#pfd-clip)">
                <text x={V_WIDTH - 60} y={cy + 8} fill="#fff" fontSize="24" fontWeight="bold" textAnchor="middle">{Math.round(altitude)}</text>
                <path d={`M ${V_WIDTH - 90} 290 L ${V_WIDTH - 110} 300 L ${V_WIDTH - 90} 310 Z`} fill="#00f0ff" />
              </g>

              {/* Heading Tape (Bottom) */}
              <rect x="200" y={V_HEIGHT - 60} width="400" height="50" fill="rgba(15, 23, 42, 0.7)" stroke="#00f0ff" strokeWidth="2" />
              <path d={`M ${cx - 10} ${V_HEIGHT - 60} L ${cx} ${V_HEIGHT - 70} L ${cx + 10} ${V_HEIGHT - 60} Z`} fill="#00f0ff" />
              <text x={cx} y={V_HEIGHT - 25} fill="#fff" fontSize="24" fontWeight="bold" textAnchor="middle">{Math.round(heading).toString().padStart(3, '0')}°</text>

              {/* Roll Indicator Arc (Top) */}
              <path d={`M ${cx - 150} 100 A 150 150 0 0 1 ${cx + 150} 100`} fill="none" stroke="#fff" strokeWidth="3" />
              <path d={`M ${cx} 100 L ${cx - 10} 120 L ${cx + 10} 120 Z`} fill="#facc15" transform={`rotate(${-roll}, ${cx}, ${cy})`} />
            </g>
          </svg>

        </div>
      </HoloPanel>
    </div>
  );
}
