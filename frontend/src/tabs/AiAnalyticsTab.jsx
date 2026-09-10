import React from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';
import { GaugeArc } from '../components/GaugeArc';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { BrainCircuit, AlertTriangle, TrendingDown, Activity } from 'lucide-react';

export function AiAnalyticsTab() {
  const { telemetry: t, sessionFrames: history } = useTelemetryStore();
  const faults = t?.faults;
  
  const rulMinutes = (t?.rulHours * 60) || 6000;
  const hours = Math.floor(rulMinutes / 60);
  const mins = Math.floor(rulMinutes % 60);
  const hasFaults = Object.values(faults || {}).some(Boolean);

  const radarData = [
    { axis: 'Thermal', val: Math.max(0, 100 - (Math.max(...(t?.chts || [90,90,90,90])) - 90) * 2) },
    { axis: 'Mechanical', val: Math.max(0, 100 - (t?.vibration?.x || 0) * 500) },
    { axis: 'Lubrication', val: Math.max(0, ((t?.oilPressure || 5) / 5) * 100) },
    { axis: 'Fuel', val: Math.max(0, 100 - Math.abs((t?.lambda || 1) - 1) * 100) },
    { axis: 'Electrical', val: Math.max(0, (((t?.batteryVoltage || 28) - 20) / 10) * 100) },
    { axis: 'Structural', val: Math.max(0, 100 - ((t?.gLoad || 1) - 1) * 30) },
    { axis: 'Vibration', val: Math.max(0, 100 - (t?.vibration?.z || 0) * 500) },
    { axis: 'Environmental', val: Math.max(0, 100 - (t?.iceRisk || 0) * 100) },
  ];

  const anomalyData = history.map((h, i) => ({ i, score: h.anomalyScore || 0 }));
  
  const componentWear = t?.componentWear || {
    'Crankshaft Bearings': 12.5,
    'Piston Rings': 8.2,
    'Valves': 5.4,
    'Turbocharger': 15.0,
    'Oil Pump': 2.1,
    'Spark Plugs': 45.0
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ENGINE HEALTH RADAR */}
      <HoloPanel className="col-span-12 lg:col-span-4" title="ENGINE HEALTH RADAR" titleIcon={<BrainCircuit size={16} />}>
        <div className="flex flex-col items-center gap-4 py-2">
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0, 240, 255, 0.15)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: '#00f0ff', fontSize: 10, fontFamily: 'monospace' }}
                />
                <Radar
                  dataKey="val"
                  stroke="#00f0ff"
                  fill="#00f0ff"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 0 5px #00f0ff)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col items-center mt-2">
            <GaugeArc
              value={t?.healthIndex || 100}
              max={100}
              unit="%"
              label="State of Health"
              size={110}
              warnline={70}
              redline={50}
              decimals={1}
              color="#0ea5e9"
              warnColor="#facc15"
              criticalColor="#ff003c"
            />
          </div>
        </div>
      </HoloPanel>

      {/* RUL + WEAR */}
      <HoloPanel className="col-span-12 lg:col-span-4" title="REMAINING USEFUL LIFE & WEAR">
        <div className="flex flex-col gap-4 py-2">
          <div className={`p-4 rounded-xl border text-center transition-all ${hasFaults ? 'border-plasma/50 bg-plasma/10' : 'border-holo/30 bg-gray-900/60'}`}>
            <div className="text-[10px] text-gray-400 tracking-widest mb-1">PREDICTED R.U.L.</div>
            <div className={`text-4xl font-mono font-bold tabular-nums ${hasFaults ? 'text-plasma animate-pulse' : 'text-holo'}`} style={{ textShadow: `0 0 10px ${hasFaults ? '#ff003c' : '#00f0ff'}` }}>
              {hours}H {String(mins).padStart(2, '0')}M
            </div>
            <div className="text-[10px] text-gray-500 mt-2">± 45 min confidence</div>
          </div>

          <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1 mt-2">
            {Object.entries(componentWear).map(([name, wear]) => {
              const wc = wear > 60 ? '#ff003c' : wear > 35 ? '#facc15' : '#00f0ff';
              return (
                <div key={name}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-400 truncate pr-2 uppercase">{name}</span>
                    <span className="font-mono text-xs tabular-nums font-bold" style={{ color: wc, textShadow: `0 0 5px ${wc}` }}>
                      {wear.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-950 border border-holo/10 rounded overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${wear}%`, backgroundColor: wc, boxShadow: `0 0 8px ${wc}` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </HoloPanel>

      {/* ANOMALY STREAM */}
      <HoloPanel className="col-span-12 lg:col-span-4" title="ISOLATION FOREST ANOMALY SCORE">
        <div className="flex flex-col gap-3 py-2">
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={anomalyData.slice(-120)}>
                <defs>
                  <linearGradient id="anom-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.1)" />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#00f0ff' }} stroke="#00f0ff" />
                <Tooltip
                  contentStyle={{
                    background: '#030712',
                    border: '1px solid #00f0ff',
                    borderRadius: '4px',
                    fontSize: 12,
                    boxShadow: '0 0 10px rgba(0,240,255,0.2)'
                  }}
                  itemStyle={{ color: '#00f0ff' }}
                />
                <ReferenceLine y={0.5} stroke="#facc15" strokeDasharray="3 2" label={{ value: 'WARN', fill: '#facc15', fontSize: 9 }} />
                <ReferenceLine y={0.8} stroke="#ff003c" strokeDasharray="3 2" label={{ value: 'CRIT', fill: '#ff003c', fontSize: 9 }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#00f0ff"
                  fill="url(#anom-grad)"
                  isAnimationActive={false}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-xl border border-holo/30 bg-gray-900/50 flex flex-col justify-between mt-4">
            <span className="text-[10px] text-gray-400 tracking-widest mb-2">CURRENT ANOMALY INDEX</span>
            <span
              className={`font-mono text-3xl font-bold tabular-nums ${(t?.anomalyScore || 0) > 0.8 ? 'text-plasma animate-pulse' : (t?.anomalyScore || 0) > 0.5 ? 'text-amber-400' : 'text-holo'}`}
              style={{ textShadow: `0 0 10px ${(t?.anomalyScore || 0) > 0.8 ? '#ff003c' : '#00f0ff'}` }}
            >
              {((t?.anomalyScore || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </HoloPanel>
    </div>
  );
}
