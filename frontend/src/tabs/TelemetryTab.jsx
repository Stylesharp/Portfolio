import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';
import { GaugeArc } from '../components/GaugeArc';
import { SparkLine } from '../components/SparkLine';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function TelemetryTab() {
  const { telemetry } = useTelemetryStore();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (telemetry) {
      setHistory(prev => {
        const newHist = [...prev, { time: new Date().getTime(), rpm: telemetry.rpm, oilPressure: telemetry.oilPressure }];
        if (newHist.length > 50) newHist.shift();
        return newHist;
      });
    }
  }, [telemetry]);

  if (!telemetry) return <div className="text-holo p-4 font-mono animate-pulse">AWAITING TELEMETRY...</div>;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Row: Master Gauge & CHTs */}
      <div className="flex gap-4 h-64">
        <HoloPanel title="MASTER PROPULSION" className="w-1/3 flex items-center justify-center">
          <GaugeArc value={telemetry.rpm} min={0} max={6000} unit="RPM" redline={5500} size={200} />
        </HoloPanel>

        <HoloPanel title="THERMAL DYNAMICS (CHT/EGT)" className="flex-1">
          <div className="flex h-full items-center justify-around">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <GaugeArc value={telemetry.chts[i]} min={50} max={300} unit="deg C" redline={240} size={100} />
                <div className="text-[10px] text-holo mt-2 font-mono">CYL {i + 1} CHT</div>
                <div className="text-xs font-mono mt-1">{telemetry.egts[i].toFixed(0)} deg C EGT</div>
              </div>
            ))}
          </div>
        </HoloPanel>
      </div>

      {/* Middle Row: Fluid & Electrical */}
      <div className="flex gap-4 h-48">
        <HoloPanel title="LUBRICATION" className="flex-1 flex justify-around items-center">
           <div className="text-center">
              <div className="text-3xl font-mono text-holo font-bold mb-1 shadow-holo drop-shadow-md">
                {telemetry.oilPressure.toFixed(2)}
              </div>
              <div className="text-[10px] text-holo/70 font-mono">OIL PRESSURE (BAR)</div>
           </div>
           <div className="text-center">
              <div className="text-3xl font-mono text-holo font-bold mb-1 drop-shadow-md">
                {telemetry.oilTemp.toFixed(1)}
              </div>
              <div className="text-[10px] text-holo/70 font-mono">OIL TEMP (deg C)</div>
           </div>
           <div className="text-center">
              <div className="text-3xl font-mono text-holo font-bold mb-1 drop-shadow-md">
                {telemetry.crankcasePressure.toFixed(2)}
              </div>
              <div className="text-[10px] text-holo/70 font-mono">CRANKCASE (BAR)</div>
           </div>
        </HoloPanel>

        <HoloPanel title="ELECTRICAL BUS" className="flex-1 flex justify-around items-center">
           <div className="text-center">
              <div className="text-3xl font-mono text-holo font-bold mb-1 drop-shadow-md">
                {telemetry.batteryVoltage.toFixed(1)}
              </div>
              <div className="text-[10px] text-holo/70 font-mono">MAIN BUS (V)</div>
           </div>
           <div className="text-center">
              <div className="text-3xl font-mono text-holo font-bold mb-1 drop-shadow-md">
                {telemetry.generatorLoad.toFixed(1)}
              </div>
              <div className="text-[10px] text-holo/70 font-mono">ALT LOAD (A)</div>
           </div>
        </HoloPanel>
      </div>

      {/* Bottom Row: Rolling Time Series */}
      <HoloPanel title="RPM TREND" className="flex-1 min-h-[200px]">
        <div className="w-full h-full pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 6000]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00f0ff', color: '#00f0ff', fontFamily: 'monospace' }}
                itemStyle={{ color: '#00f0ff' }}
                labelStyle={{ display: 'none' }}
              />
              <Area type="monotone" dataKey="rpm" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRpm)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </HoloPanel>
    </div>
  );
}
