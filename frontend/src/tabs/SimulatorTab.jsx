import React from 'react';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { HoloPanel } from '../components/HoloPanel';
import { Power, ToggleLeft, ToggleRight, Plane, ShieldAlert, Sparkles } from 'lucide-react';

const Switch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-2 border-b border-holo/10 hover:bg-holo/5 px-2 rounded transition-colors">
    <div>
      <span className="font-mono text-xs uppercase text-gray-200 block">{label}</span>
      {description && <span className="text-[10px] text-gray-500 block">{description}</span>}
    </div>
    <button onClick={() => onChange(!checked)} className="text-holo transition-transform active:scale-95">
      {checked ? <ToggleRight size={26} className="text-holo drop-shadow-[0_0_8px_#00f0ff]" /> : <ToggleLeft size={26} className="text-gray-600" />}
    </button>
  </div>
);

const FaultSwitch = ({ checked, onChange, label, severity = 'CRITICAL' }) => (
  <div className={`flex items-center justify-between py-2 border-b border-plasma/10 px-2 rounded transition-colors ${checked ? 'bg-plasma/15' : 'hover:bg-plasma/5'}`}>
    <div>
      <span className={`font-mono text-xs uppercase block font-bold ${checked ? 'text-plasma' : 'text-gray-300'}`}>{label}</span>
      <span className="text-[9px] text-gray-500">{severity} RISK</span>
    </div>
    <button onClick={() => onChange(!checked)} className="transition-transform active:scale-95">
      {checked ? <ToggleRight size={26} className="text-plasma drop-shadow-[0_0_8px_#ff003c]" /> : <ToggleLeft size={26} className="text-gray-600 hover:text-plasma/60" />}
    </button>
  </div>
);

const Slider = ({ value, onChange, label, unit = '%', min = 0, max = 100, step = 1 }) => (
  <div className="py-2 px-2 bg-gray-950/40 rounded border border-holo/10 mb-2">
    <div className="flex justify-between font-mono text-xs mb-1.5">
      <span className="text-gray-300 uppercase">{label}</span>
      <span className="text-holo font-bold">{value.toFixed(0)} {unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step}
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full"
    />
  </div>
);

export function SimulatorTab({ sendCommand }) {
  const { telemetry } = useTelemetryStore();

  if (!telemetry) return <div className="text-holo p-4 font-mono animate-pulse">AWAITING SIMULATION LINK...</div>;

  const actuators = telemetry.actuators;
  const faults = telemetry.faults;

  const handleActuator = (key, value) => {
    sendCommand({ type: 'setActuator', payload: { key, value } });
  };

  const handleFault = (key, value) => {
    sendCommand({ type: 'setFault', payload: { key, value } });
  };

  // Quick Mission Preset setter
  const applyPreset = (preset) => {
    if (preset === 'TAKEOFF') {
      handleActuator('throttle', 100);
      handleActuator('mixture', 90);
      handleActuator('propPitch', 100);
      handleActuator('flaps', 15);
      handleActuator('gearDown', true);
      handleActuator('hydPump', true);
    } else if (preset === 'CRUISE') {
      handleActuator('throttle', 75);
      handleActuator('mixture', 55);
      handleActuator('propPitch', 80);
      handleActuator('flaps', 0);
      handleActuator('gearDown', false);
      handleActuator('autopilot', true);
    } else if (preset === 'IDLE_DESCENT') {
      handleActuator('throttle', 20);
      handleActuator('mixture', 65);
      handleActuator('propPitch', 40);
      handleActuator('flaps', 20);
      handleActuator('gearDown', true);
    } else if (preset === 'CLEAR_FAULTS') {
      Object.keys(faults).forEach(k => handleFault(k, false));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 font-mono select-none">
      {/* Flight & Engine Actuators */}
      <HoloPanel title="FLIGHT CONTROLS & PRIMARY ACTUATORS" className="flex-1 overflow-y-auto">
        {/* Quick Scenario Buttons */}
        <div className="mb-4 bg-gray-950/60 p-3 rounded border border-holo/20">
          <div className="text-[10px] text-holo uppercase tracking-wider mb-2 flex items-center">
            <Sparkles size={12} className="mr-1" /> Quick Flight Presets
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => applyPreset('TAKEOFF')} className="py-1.5 px-2 bg-holo/10 hover:bg-holo/25 border border-holo/40 text-holo text-[11px] rounded transition-colors">
              TAKEOFF (100%)
            </button>
            <button onClick={() => applyPreset('CRUISE')} className="py-1.5 px-2 bg-holo/10 hover:bg-holo/25 border border-holo/40 text-holo text-[11px] rounded transition-colors">
              CRUISE (75%)
            </button>
            <button onClick={() => applyPreset('IDLE_DESCENT')} className="py-1.5 px-2 bg-holo/10 hover:bg-holo/25 border border-holo/40 text-holo text-[11px] rounded transition-colors">
              DESCENT (20%)
            </button>
            <button onClick={() => applyPreset('CLEAR_FAULTS')} className="py-1.5 px-2 bg-plasma/10 hover:bg-plasma/25 border border-plasma text-plasma text-[11px] rounded transition-colors">
              RESET FAULTS
            </button>
          </div>
        </div>

        {/* Primary Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Slider label="Throttle" value={actuators.throttle} onChange={(v) => handleActuator('throttle', v)} />
          <Slider label="Mixture" value={actuators.mixture} onChange={(v) => handleActuator('mixture', v)} />
          <Slider label="Prop Pitch" value={actuators.propPitch} onChange={(v) => handleActuator('propPitch', v)} />
        </div>

        {/* Aerodynamic Surfaces & Gear */}
        <div className="mb-4 border border-holo/20 p-3 bg-gray-900/40 rounded">
          <div className="text-[10px] text-holo mb-2 uppercase tracking-widest flex items-center">
            <Plane size={12} className="mr-1" /> Aero Surfaces & Landing Gear
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">Flaps Deploy</span>
                <span className="text-holo font-bold">{actuators.flaps}°</span>
              </div>
              <div className="flex gap-1">
                {[0, 10, 20, 30, 40].map(deg => (
                  <button 
                    key={deg} 
                    onClick={() => handleActuator('flaps', deg)}
                    className={`flex-1 py-1 text-[10px] rounded border ${actuators.flaps === deg ? 'bg-holo/30 border-holo text-holo shadow-[0_0_8px_#00f0ff]' : 'border-gray-800 text-gray-400 hover:border-gray-600'}`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            <Switch 
              label="Landing Gear" 
              checked={actuators.gearDown} 
              onChange={(v) => handleActuator('gearDown', v)} 
              description={actuators.gearDown ? "GEAR DOWN & LOCKED" : "RETRACTED UP"}
            />
          </div>
        </div>

        {/* Electrical & Ancillary Switches */}
        <div className="border border-holo/20 p-3 bg-gray-900/40 rounded mb-4">
          <div className="text-[10px] text-holo mb-2 uppercase tracking-widest flex items-center">
            <Power size={12} className="mr-1" /> Subsystem Power & Thermal Busses
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Switch label="Carb Heat" checked={actuators.carbHeat} onChange={(v) => handleActuator('carbHeat', v)} description="De-ice Venturi Throat" />
            <Switch label="Anti-Ice System" checked={actuators.antiIce} onChange={(v) => handleActuator('antiIce', v)} description="Leading Edge Elements" />
            <Switch label="Generator / Alt" checked={actuators.generatorSwitch} onChange={(v) => handleActuator('generatorSwitch', v)} description="28V Main Bus Charge" />
            <Switch label="Autopilot FADEC" checked={actuators.autopilot} onChange={(v) => handleActuator('autopilot', v)} description="Nav Course Tracking" />
            <Switch label="Avionics Fan" checked={actuators.avionicsFan} onChange={(v) => handleActuator('avionicsFan', v)} description="Bay Forced Air Cooling" />
            <Switch label="Hydraulic Pump" checked={actuators.hydPump} onChange={(v) => handleActuator('hydPump', v)} description="3000 PSI Surface System" />
          </div>
        </div>

        {/* Fuel Selector */}
        <div className="border border-holo/20 p-3 bg-gray-900/40 rounded">
          <div className="text-[10px] text-holo mb-2 uppercase tracking-widest flex justify-between">
            <span>Fuel Tank Routing</span>
            <span className="text-holo font-bold">[{actuators.fuelSelector}]</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['BOTH', 'LEFT', 'RIGHT', 'OFF'].map(sel => (
              <button 
                key={sel}
                onClick={() => handleActuator('fuelSelector', sel)}
                className={`py-1.5 font-mono text-xs rounded border transition-all ${actuators.fuelSelector === sel ? 'bg-holo/25 border-holo text-holo shadow-[0_0_10px_#00f0ff] font-bold' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}
              >
                {sel}
              </button>
            ))}
          </div>
        </div>
      </HoloPanel>

      {/* Hardware-In-The-Loop Fault Matrix */}
      <HoloPanel title="H.I.L. FAULT INJECTOR MATRIX" className="w-full lg:w-[420px] overflow-y-auto">
        <div className="flex items-center space-x-2 mb-3 p-2 bg-plasma/10 border border-plasma/40 rounded">
          <ShieldAlert size={18} className="text-plasma shrink-0 animate-pulse" />
          <span className="font-mono text-[10px] text-plasma">ACTIVE REAL-TIME PHYSICS INJECTION. TRIGGERS INSTANT COPILOT ALERTS.</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <FaultSwitch label="Cyl 2 Overheat" checked={faults.cyl2Overheat} onChange={(v) => handleFault('cyl2Overheat', v)} severity="CRITICAL" />
          <FaultSwitch label="Oil Line Rupture" checked={faults.oilLineRupture} onChange={(v) => handleFault('oilLineRupture', v)} severity="CATASTROPHIC" />
          <FaultSwitch label="Hydraulic Line Leak" checked={faults.hydLeak} onChange={(v) => handleFault('hydLeak', v)} severity="CRITICAL" />
          <FaultSwitch label="Avionics Overheat" checked={faults.avionicsOverheat} onChange={(v) => handleFault('avionicsOverheat', v)} severity="HIGH" />
          <FaultSwitch label="Alternator Failure" checked={faults.alternatorFailure} onChange={(v) => handleFault('alternatorFailure', v)} severity="HIGH" />
          <FaultSwitch label="Main Bearing Wear" checked={faults.mainBearingWear} onChange={(v) => handleFault('mainBearingWear', v)} severity="MEDIUM" />
          <FaultSwitch label="Prop Governor Fail" checked={faults.propGovernorFail} onChange={(v) => handleFault('propGovernorFail', v)} severity="HIGH" />
          <FaultSwitch label="Carb Icing Event" checked={faults.carbIcingEvent} onChange={(v) => handleFault('carbIcingEvent', v)} severity="HIGH" />
          <FaultSwitch label="Major Coolant Leak" checked={faults.coolantLeakMajor} onChange={(v) => handleFault('coolantLeakMajor', v)} severity="CRITICAL" />
          <FaultSwitch label="Prop Strike" checked={faults.propStrike} onChange={(v) => handleFault('propStrike', v)} severity="CATASTROPHIC" />
        </div>
      </HoloPanel>
    </div>
  );
}
