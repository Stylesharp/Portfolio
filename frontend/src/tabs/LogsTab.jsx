import React, { useState, useEffect, useRef } from 'react';
import { HoloPanel } from '../components/HoloPanel';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { Download, Terminal as TerminalIcon, ShieldAlert, AlertTriangle, Info, Trash2, Search, Play, CheckCircle, RefreshCw } from 'lucide-react';

export function LogsTab() {
  const { alarmLog, sessionFrames, clearAlarms, telemetry, connected, latency } = useTelemetryStore();
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Terminal state
  const [termInput, setTermInput] = useState('');
  const [termLogs, setTermLogs] = useState([
    'MIL-STD-1553B AVIONICS TELEMETRY INTERFACE V2.4',
    'TYPE "help" FOR AVAILABLE DIAGNOSTIC UTILITIES.',
    '-------------------------------------------------------',
    '[OK] TELEMETRY SUITE: ONLINE (10Hz SYNC)',
    '[OK] FADEC ENGINE CONTROLLER: NORMAL ENVELOPE',
    '[OK] BLACKBOX RECORDER: ARMED AND LOGGING',
  ]);
  const [runningDiag, setRunningDiag] = useState(false);
  const termEndRef = useRef(null);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [termLogs]);

  // Export JSONL Blackbox
  const exportBlackboxJSONL = () => {
    const framesToExport = sessionFrames.length > 0 ? sessionFrames : [telemetry];
    const jsonlContent = framesToExport.map(f => JSON.stringify(f)).join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uav_blackbox_flight_${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTermLogs(prev => [...prev, `> BLACKBOX EXPORTED: ${framesToExport.length} telemetry frames packaged into JSONL.`]);
  };

  // Run MIL-STD Diagnostic Suite
  const runDiagnostics = () => {
    if (runningDiag) return;
    setRunningDiag(true);
    setTermLogs(prev => [
      ...prev,
      '-------------------------------------------------------',
      '> INITIATING MIL-STD-810H SYSTEM DIAGNOSTIC SELF-TEST...',
    ]);

    const steps = [
      { msg: '[TEST 1/6] AVIONICS POWER BUS: 28.0V CHECK... [PASSED]', delay: 400 },
      { msg: `[TEST 2/6] LUBRICATION SENSORS: ${telemetry.oilPressure > 1.5 ? '[PASSED]' : '[FAILED - LOW PRESSURE]'}`, delay: 900 },
      { msg: `[TEST 3/6] CYLINDER HEAD THERMAL UNIFORMITY: ${Math.max(...telemetry.chts) < 230 ? '[PASSED]' : '[WARNING - CYL OVERHEAT]'}`, delay: 1400 },
      { msg: `[TEST 4/6] HYDRAULIC PRESSURE MATRIX: ${telemetry.hydPressure > 2000 ? '[PASSED]' : '[DEGRADED]'}`, delay: 1900 },
      { msg: `[TEST 5/6] BLACKBOX STORAGE RING: ${sessionFrames.length} FRAMES BUFFERED... [OK]`, delay: 2400 },
      { msg: '[TEST 6/6] DIGITAL TWIN PREDICTIVE MODEL SYNC: [ALL CLEAR]', delay: 2900 },
      { msg: '> DIAGNOSTIC SUITE COMPLETE. REPORT STORED IN TELEMETRY LOG.', delay: 3200 },
    ];

    steps.forEach(({ msg, delay }) => {
      setTimeout(() => {
        setTermLogs(prev => [...prev, msg]);
      }, delay);
    });

    setTimeout(() => {
      setRunningDiag(false);
    }, 3300);
  };

  const handleCommand = (e, explicitCmd = null) => {
    if (e) e.preventDefault();
    const cmdText = explicitCmd !== null ? explicitCmd : termInput;
    const cmd = cmdText.trim().toLowerCase();
    if (!cmd) return;

    const newLogs = [...termLogs, `> ${cmdText}`];

    if (cmd === 'help') {
      newLogs.push(
        'COMMANDS:',
        '  diag     - Run automated MIL-STD diagnostic tests',
        '  status   - Dump current engine telemetry state',
        '  export   - Download blackbox session JSONL',
        '  ping     - Display data link latency',
        '  clear    - Clear terminal window',
        '  alarms   - Print active alarm summary'
      );
    } else if (cmd === 'diag') {
      setTermLogs(newLogs);
      if (explicitCmd === null) setTermInput('');
      runDiagnostics();
      return;
    } else if (cmd === 'status') {
      newLogs.push(
        `[STATUS] RPM: ${Math.round(telemetry?.rpm || 0)}`,
        `[STATUS] Oil P: ${telemetry?.oilPressure?.toFixed(2)} BAR`,
        `[STATUS] CHT (avg): ${(telemetry?.chts?.reduce((a,b)=>a+b,0)/4 || 0).toFixed(1)} deg C`,
        `[STATUS] RUL: ${((telemetry?.rulHours * 60) || 6000).toFixed(0)} MINS`
      );
    } else if (cmd === 'export') {
      newLogs.push('[SYSTEM] Exporting blackbox flight recorder data...');
      exportBlackboxJSONL();
    } else if (cmd === 'ping') {
      newLogs.push(`DATA LINK LATENCY: ${latency} ms | STATUS: ${connected ? 'CONNECTED (WEBSOCKET 10Hz)' : 'DISCONNECTED'}`);
    } else if (cmd === 'clear') {
      setTermLogs(['TERMINAL CLEARED. TYPE "help" FOR COMMANDS.']);
      setTermInput('');
      return;
    } else if (cmd === 'alarms') {
      newLogs.push(`ACTIVE LOGGED ALARMS: ${alarmLog.length} ENTRIES.`);
    } else {
      newLogs.push(`UNKNOWN COMMAND: "${cmd}". TYPE "help" FOR AVAILABLE COMMANDS.`);
    }

    setTermLogs(newLogs);
    setTermInput('');
  };

  // Filter alarms
  const filteredAlarms = alarmLog.filter(a => {
    if (filter !== 'ALL' && a.severity !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return a.message.toLowerCase().includes(term) || a.component.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 font-mono select-none">
      {/* Left Column: Filterable Structured Alarm Log Table */}
      <HoloPanel title="MISSION ALARM & TELEMETRY EVENT FEED" className="flex-1 flex flex-col min-h-[380px]">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-holo/20 mb-3">
          {/* Severity Filters */}
          <div className="flex gap-1">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-2.5 py-1 text-[10px] rounded border transition-colors ${
                  filter === sev ? 'bg-holo/25 border-holo text-holo shadow-[0_0_8px_#00f0ff] font-bold' : 'border-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search & Clear */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={12} className="absolute left-2 top-2 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-40 pl-6 pr-2 py-1 bg-gray-950/80 border border-holo/20 rounded text-[10px] text-gray-200 focus:outline-none focus:border-holo"
              />
            </div>

            <button 
              onClick={clearAlarms}
              className="p-1.5 border border-plasma/40 text-plasma hover:bg-plasma/20 rounded transition-colors"
              title="Clear Alarms"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Scrolling Alarm Table */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className={`p-2.5 rounded border text-xs flex flex-col gap-1 transition-all ${
                alarm.severity === 'CRITICAL' ? 'bg-plasma/15 border-plasma text-plasma shadow-[0_0_8px_rgba(255,0,60,0.15)]' :
                alarm.severity === 'WARNING' ? 'bg-amber-400/10 border-amber-400/50 text-amber-300' :
                'bg-gray-950/60 border-holo/20 text-gray-300'
              }`}
            >
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold flex items-center space-x-1 uppercase">
                  {alarm.severity === 'CRITICAL' && <ShieldAlert size={12} className="text-plasma" />}
                  {alarm.severity === 'WARNING' && <AlertTriangle size={12} className="text-amber-400" />}
                  {alarm.severity === 'INFO' && <Info size={12} className="text-holo" />}
                  <span>{alarm.component}</span>
                </span>
                <span className="opacity-70">{new Date(alarm.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-[11px] opacity-95">{alarm.message}</p>
            </div>
          ))}

          {filteredAlarms.length === 0 && (
            <div className="text-center text-gray-500 py-12 text-xs italic">
              NO ALARM EVENTS MATCH CURRENT FILTER
            </div>
          )}
        </div>
      </HoloPanel>

      {/* Right Column: Blackbox Recorder & Interactive Diagnostic Terminal */}
      <div className="flex-1 flex flex-col gap-4 min-h-[380px]">
        {/* Blackbox Recorder Panel */}
        <HoloPanel title="TELEMETRY BLACKBOX FLIGHT RECORDER" className="h-[150px] flex items-center justify-between px-6">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-holo text-xl font-bold">
              <span>REC</span>
              <span className="w-2.5 h-2.5 rounded-full bg-plasma shadow-[0_0_8px_#ff003c] animate-ping" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              BUFFER: <strong className="text-holo">{sessionFrames.length}</strong> frames @ 10Hz ({((sessionFrames.length * 0.1) / 60).toFixed(1)} mins)
            </p>
            <p className="text-[10px] text-gray-500">FORMAT: IEEE 754 JSONL FLIGHT LOG</p>
          </div>

          <button 
            onClick={exportBlackboxJSONL}
            className="flex items-center space-x-2 px-4 py-2.5 bg-holo/15 hover:bg-holo/30 border border-holo text-holo rounded text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] active:scale-95"
          >
            <Download size={15} />
            <span>EXPORT JSONL</span>
          </button>
        </HoloPanel>
        
        {/* Interactive MIL-STD Checklist & Command Terminal */}
        <HoloPanel title="MIL-STD-1553B DIAGNOSTIC TERMINAL" className="flex-1 flex flex-col" scanline>
          {/* Quick Action Bar */}
          <div className="flex gap-2 pb-2 mb-2 border-b border-holo/10">
            <button 
              onClick={runDiagnostics} 
              disabled={runningDiag}
              className="px-2 py-1 bg-holo/10 hover:bg-holo/25 border border-holo/30 text-holo text-[10px] rounded flex items-center space-x-1"
            >
              {runningDiag ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
              <span>RUN DIAGNOSTIC SUITE</span>
            </button>

            <button 
              onClick={(e) => handleCommand(e, 'status')}
              className="px-2 py-1 bg-gray-900 border border-gray-700 text-gray-300 hover:text-holo text-[10px] rounded"
            >
              SNAPSHOT
            </button>

            <button 
              onClick={() => setTermLogs(['TERMINAL CLEARED.'])} 
              className="px-2 py-1 bg-gray-900 border border-gray-700 text-gray-300 hover:text-plasma text-[10px] rounded"
            >
              CLEAR
            </button>
          </div>

          {/* Terminal Console Output */}
          <div className="flex-1 p-2.5 bg-gray-950/95 border border-gray-800 rounded font-mono text-[11px] text-gray-300 overflow-y-auto space-y-1">
            {termLogs.map((log, idx) => (
              <div 
                key={idx} 
                className={
                  log.includes('[PASSED]') || log.includes('[OK]') ? 'text-holo' :
                  log.includes('[FAILED') || log.includes('CRITICAL') ? 'text-plasma' :
                  log.includes('[WARNING') ? 'text-amber-400' :
                  log.startsWith('>') ? 'text-gray-400 font-bold' :
                  'text-gray-300'
                }
              >
                {log}
              </div>
            ))}
            <div ref={termEndRef} />
          </div>

          {/* Terminal Command Input */}
          <form onSubmit={handleCommand} className="mt-2 flex items-center space-x-2">
            <TerminalIcon size={14} className="text-holo shrink-0" />
            <input
              type="text"
              placeholder="Enter command (e.g. help, diag, status)..."
              value={termInput}
              onChange={(e) => setTermInput(e.target.value)}
              className="flex-1 bg-gray-950 border border-holo/30 px-2 py-1 rounded text-xs text-holo placeholder-gray-600 focus:outline-none focus:border-holo"
            />
            <button type="submit" className="px-3 py-1 bg-holo/20 hover:bg-holo/30 border border-holo text-holo text-xs font-bold rounded">
              SEND
            </button>
          </form>
        </HoloPanel>
      </div>
    </div>
  );
}
