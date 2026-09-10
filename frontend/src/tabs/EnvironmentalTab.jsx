import React from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';
import { GaugeArc } from '../components/GaugeArc';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Wind, CloudRain, Compass, Thermometer, ArrowUpRight } from 'lucide-react';

const ISA_DATA = [
  { alt: 0, temp: 15.0, press: 1013, density: 1.225 },
  { alt: 5000, temp: 5.1, press: 843, density: 1.056 },
  { alt: 10000, temp: -4.8, press: 697, density: 0.905 },
  { alt: 15000, temp: -14.7, press: 572, density: 0.771 },
  { alt: 20000, temp: -24.6, press: 466, density: 0.653 },
  { alt: 25000, temp: -34.5, press: 376, density: 0.549 },
  { alt: 30000, temp: -44.4, press: 301, density: 0.458 },
];

export function EnvironmentalTab() {
  const { telemetry } = useTelemetryStore();
  if (!telemetry) return <div className="text-holo p-4 font-mono animate-pulse">AWAITING ENVIRONMENTAL SENSORS...</div>;

  const currentAlt = telemetry.densityAltitude || 8500; // Simulated altitude ft
  const densityRatio = Math.max(0.4, 1 - (telemetry.densityAltitude / 30000) * 0.6);
  const powerLossPct = ((1 - densityRatio) * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-4 font-mono select-none">
      {/* Top Row: Ambient Conditions & Wind Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[220px]">
        {/* Core Ambient Cards */}
        <HoloPanel title="ATMOSPHERIC CONDITIONS" className="sm:col-span-2">
          <div className="grid grid-cols-3 gap-2 h-full items-center">
            <div className="text-center p-3 bg-gray-950/50 rounded border border-holo/10">
              <div className="text-3xl font-bold text-holo mb-1 drop-shadow-md">{telemetry.ambientTemp.toFixed(1)}deg C</div>
              <div className="text-[10px] text-gray-400">OUTSIDE AIR TEMP (OAT)</div>
              <div className="text-[9px] text-holo/60 mt-1">ISA DEV: +2.4deg C</div>
            </div>

            <div className="text-center p-3 bg-gray-950/50 rounded border border-holo/10">
              <div className="text-3xl font-bold text-holo mb-1 drop-shadow-md">{telemetry.ambientPressure.toFixed(0)}</div>
              <div className="text-[10px] text-gray-400">BARO PRESSURE (QNH hPa)</div>
              <div className="text-[9px] text-holo/60 mt-1">29.92 inHg</div>
            </div>

            <div className="text-center p-3 bg-gray-950/50 rounded border border-holo/10">
              <div className="text-3xl font-bold text-holo mb-1 drop-shadow-md">{telemetry.densityAltitude.toFixed(0)}'</div>
              <div className="text-[10px] text-gray-400">DENSITY ALTITUDE</div>
              <div className="text-[9px] text-plasma mt-1">PWR LOSS: -{powerLossPct}%</div>
            </div>
          </div>
        </HoloPanel>

        {/* Icing & Wind Risk */}
        <HoloPanel title="WIND & ICING HAZARD" className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-around w-full">
            <div className="flex flex-col items-center">
              <GaugeArc value={telemetry.iceRisk * 100} min={0} max={100} unit="%" redline={70} size={120} />
              <div className="text-[10px] text-holo mt-1 uppercase font-bold">Icing Risk</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-gray-950/60 rounded border border-holo/10">
              <div className="relative w-16 h-16 rounded-full border border-holo/30 flex items-center justify-center mb-1">
                <div 
                  className="w-1 h-7 bg-holo shadow-[0_0_8px_#00f0ff] rounded origin-bottom"
                  style={{ transform: `rotate(${telemetry.windDir}deg)` }}
                />
                <span className="absolute text-[8px] top-0 text-holo">N</span>
              </div>
              <span className="text-xs font-bold text-holo">{telemetry.windSpeed.toFixed(1)} KTS</span>
              <span className="text-[9px] text-gray-400">DIR: {telemetry.windDir}deg</span>
            </div>
          </div>
        </HoloPanel>
      </div>
      
      {/* Bottom Row: True ISA Standard Atmosphere Multi-Curve Profile */}
      <HoloPanel title="ISA ATMOSPHERIC PROFILE & UAV FLIGHT LEVEL" className="flex-1 min-h-[300px]">
        <div className="w-full flex-1 pb-4">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ISA_DATA} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <XAxis dataKey="alt" unit="ft" tick={{ fill: '#00f0ff', fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: '#0ea5e9', fontSize: 10 }} label={{ value: 'Temp (deg C)', angle: -90, position: 'insideLeft', fill: '#0ea5e9', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#facc15', fontSize: 10 }} label={{ value: 'Pressure (hPa)', angle: 90, position: 'insideRight', fill: '#facc15', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#00f0ff', color: '#00f0ff', fontSize: '11px' }}
              />
              <ReferenceLine x={currentAlt} stroke="#ff003c" strokeDasharray="4 4" label={{ value: 'UAV ALT (8,500 ft)', fill: '#ff003c', fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="OAT (deg C)" isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="press" stroke="#facc15" strokeWidth={2} dot={{ r: 3 }} name="Pressure (hPa)" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </HoloPanel>
    </div>
  );
}