import React, { useState } from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { Navigation, Plus } from 'lucide-react';

const VN_ENVELOPE = [
  { kts: 0, maxG: 0, minG: 0 },
  { kts: 45, maxG: 1.0, minG: -0.2 },
  { kts: 65, maxG: 2.1, minG: -0.8 },
  { kts: 88, maxG: 3.8, minG: -1.5 },
  { kts: 120, maxG: 3.8, minG: -1.5 },
  { kts: 145, maxG: 3.8, minG: -1.5 }, // Vne (Never Exceed)
  { kts: 155, maxG: 0, minG: 0 },
];

const INITIAL_WAYPOINTS = [
  { id: 'WPT-1', name: 'ALPHA (DEPARTURE)', dist: '0.0 NM', eta: '14:00:00Z', alt: '2,500 FT', status: 'PASSED' },
  { id: 'WPT-2', name: 'BRAVO (LOITER AREA)', dist: '24.5 NM', eta: '14:18:30Z', alt: '8,500 FT', status: 'ACTIVE' },
  { id: 'WPT-3', name: 'CHARLIE (SURVEILLANCE)', dist: '68.2 NM', eta: '14:52:10Z', alt: '12,000 FT', status: 'QUEUED' },
  { id: 'WPT-4', name: 'DELTA (RETURN / RTB)', dist: '115.0 NM', eta: '15:30:00Z', alt: '3,000 FT', status: 'QUEUED' },
];

export function MissionPlanningTab() {
  const { telemetry } = useTelemetryStore();
  const [waypoints, setWaypoints] = useState(INITIAL_WAYPOINTS);
  const [activeWpt, setActiveWpt] = useState('WPT-2');

  if (!telemetry) return <div className="text-holo p-4 font-mono animate-pulse">AWAITING MISSION COMPUTER...</div>;

  const totalFuel = (telemetry.fuelLevelL + telemetry.fuelLevelR).toFixed(1);
  const currentSpeedKts = Math.round((telemetry.rpm / 5500) * 110);
  const currentG = telemetry.gLoad.toFixed(2);
  const enduranceHrs = ((telemetry.fuelLevelL + telemetry.fuelLevelR) / Math.max(0.2, (telemetry.rpm / 5500) * 14)).toFixed(1);

  return (
    <div className="flex flex-col lg:flex-row gap-4 font-mono select-none">
      {/* Left Column: V-n Envelope & Power Curve */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Power Curve (Thrust vs Airspeed) */}
        <HoloPanel title="POWER CURVE & FLIGHT ENVELOPE" className="flex-1 min-h-[300px]">
          <div className="flex flex-col h-full gap-4">
            
            <div className="w-full h-1/2 min-h-[140px] border-b border-holo/10 pb-2">
              <span className="text-[10px] text-gray-500 mb-1 block">THRUST AVAIL VS DRAG (KTS)</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Array.from({ length: 40 }, (_, i) => {
                  const v = 40 + i * 3;
                  const power = 65 * ((telemetry.powerBhp || 100) / 100) * (1 - Math.pow((v - 110) / 110, 2));
                  const drag = 0.02 * v * v;
                  return { v, power: Math.max(0, power), drag: Math.max(0, drag) };
                })} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="v" tick={{ fill: '#0ea5e9', fontSize: 9 }} stroke="#0ea5e9" />
                  <YAxis tick={{ fill: '#0ea5e9', fontSize: 9 }} stroke="#0ea5e9" />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#00f0ff', color: '#00f0ff', fontSize: '11px' }} />
                  <ReferenceLine x={currentSpeedKts} stroke="#facc15" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="power" stroke="#00f0ff" strokeWidth={2} name="Thrust %" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="drag" stroke="#ff003c" strokeWidth={1.5} name="Drag %" strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full h-1/2 min-h-[140px]">
              <span className="text-[10px] text-gray-500 mb-1 block">V-N LOAD FACTOR DIAGRAM</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={VN_ENVELOPE} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="kts" unit="kts" tick={{ fill: '#00f0ff', fontSize: 9 }} stroke="#00f0ff" />
                  <YAxis domain={[-2, 5]} tick={{ fill: '#0ea5e9', fontSize: 9 }} stroke="#0ea5e9" />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#00f0ff', color: '#00f0ff', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="maxG" stroke="#00f0ff" strokeWidth={2} name="+G Limit" isAnimationActive={false} />
                  <Line type="monotone" dataKey="minG" stroke="#0ea5e9" strokeWidth={2} name="-G Limit" isAnimationActive={false} />
                  <ReferenceLine x={currentSpeedKts} stroke="#facc15" strokeDasharray="3 3" />
                  <ReferenceDot x={currentSpeedKts} y={parseFloat(currentG)} r={6} fill="#ff003c" stroke="#fff" />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </HoloPanel>

        {/* Range & Fuel Endurance Summary */}
        <HoloPanel title="RANGE & FUEL ENDURANCE ESTIMATOR" className="h-[140px]">
          <div className="grid grid-cols-3 gap-2 h-full items-center text-center">
            <div className="p-2 bg-gray-950/60 rounded border border-holo/10">
              <span className="text-[10px] text-gray-400 block">TOTAL FUEL MASS</span>
              <span className="text-2xl font-bold text-holo">{totalFuel} L</span>
              <span className="text-[9px] text-gray-500 block">{(totalFuel * 0.72).toFixed(1)} KG AVGAS</span>
            </div>

            <div className="p-2 bg-gray-950/60 rounded border border-holo/10">
              <span className="text-[10px] text-gray-400 block">REMAINING ENDURANCE</span>
              <span className="text-2xl font-bold text-holo">{enduranceHrs} HRS</span>
              <span className="text-[9px] text-gray-500 block">@ CRUISE 75% THR</span>
            </div>

            <div className="p-2 bg-gray-950/60 rounded border border-holo/10">
              <span className="text-[10px] text-gray-400 block">EST. COMBAT RADIUS</span>
              <span className="text-2xl font-bold text-holo">{(enduranceHrs * 95).toFixed(0)} NM</span>
              <span className="text-[9px] text-holo/70 block">WITH 30 MIN RESERVE</span>
            </div>
          </div>
        </HoloPanel>
      </div>

      {/* Right Column: Mission Waypoint Route Planner */}
      <HoloPanel title="TACTICAL WAYPOINT ROUTING & ETA" className="w-full lg:w-[440px] flex flex-col">
        <div className="flex justify-between items-center pb-2 border-b border-holo/20 mb-3">
          <span className="text-xs text-gray-300 flex items-center">
            <Navigation size={13} className="mr-1 text-holo" /> FLIGHT PLAN: UCAV-PATROL-04
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-holo/20 text-holo rounded border border-holo/40">FADEC ACTIVE</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {waypoints.map((wpt) => {
            const isActive = wpt.id === activeWpt;
            return (
              <div 
                key={wpt.id}
                onClick={() => setActiveWpt(wpt.id)}
                className={`p-3 rounded border cursor-pointer transition-all ${isActive ? 'bg-holo/15 border-holo shadow-[0_0_12px_rgba(0,240,255,0.2)]' : 'bg-gray-950/50 border-holo/10 hover:border-holo/40'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${isActive ? 'text-holo' : 'text-gray-200'}`}>{wpt.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${wpt.status === 'PASSED' ? 'text-gray-500 bg-gray-900' : wpt.status === 'ACTIVE' ? 'text-holo bg-holo/20 animate-pulse' : 'text-gray-400 bg-gray-900'}`}>
                    {wpt.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400 mt-2">
                  <div>DIST: <strong className="text-gray-200">{wpt.dist}</strong></div>
                  <div>ALT: <strong className="text-gray-200">{wpt.alt}</strong></div>
                  <div>ETA: <strong className="text-holo">{wpt.eta}</strong></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-holo/20 mt-3 flex gap-2">
          <button 
            onClick={() => {
              const newId = `WPT-${waypoints.length + 1}`;
              setWaypoints([...waypoints, { id: newId, name: `CUSTOM WAYPOINT ${waypoints.length + 1}`, dist: '142.0 NM', eta: '16:15:00Z', alt: '10,000 FT', status: 'QUEUED' }]);
            }}
            className="flex-1 py-2 bg-holo/10 hover:bg-holo/25 border border-holo/40 text-holo text-xs font-bold rounded flex items-center justify-center space-x-1 transition-colors"
          >
            <Plus size={14} />
            <span>ADD WAYPOINT</span>
          </button>
        </div>
      </HoloPanel>
    </div>
  );
}
