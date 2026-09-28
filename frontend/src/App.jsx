import React, { useEffect, useRef } from 'react';
import { useTelemetryStore } from './store/useTelemetryStore';
import { GlobalHeader } from './components/GlobalHeader';
import { Sidebar } from './components/Sidebar';
import { AlertManager } from './components/AlertManager';
import { Engine3DViewer } from './components/Engine3DViewer';

// Tabs
import { TelemetryTab } from './tabs/TelemetryTab';
import { AiAnalyticsTab } from './tabs/AiAnalyticsTab';
import { SimulatorTab } from './tabs/SimulatorTab';
import { LogsTab } from './tabs/LogsTab';
import { EnvironmentalTab } from './tabs/EnvironmentalTab';
import { MissionPlanningTab } from './tabs/MissionPlanningTab';
import { FlightDynamicsTab } from './tabs/FlightDynamicsTab';
import { TacticalMapTab } from './tabs/TacticalMapTab';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'localhost:8000';
const WS_URL = import.meta.env.PROD 
  ? `wss://${BACKEND_URL}/ws/twin` 
  : `ws://${BACKEND_URL}/ws/twin`;

export default function App() {
  const { setConnected, updateTelemetry, setLatency, activePanel } = useTelemetryStore();
  const wsRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout;
    
    const connect = () => {
      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        setConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const start = performance.now();
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry') {
            updateTelemetry(data.payload);
          }
          setLatency(Math.round(performance.now() - start));
        } catch (e) {
          console.error(e);
        }
      };
      
      wsRef.current.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };
    
    connect();
    
    return () => {
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, [setConnected, updateTelemetry, setLatency]);

  // Command sender helper
  const sendCommand = (cmd) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  };

  const renderActiveTab = () => {
    switch (activePanel) {
      case 0: return <TelemetryTab />;
      case 1: return null; // Tab 1 leverages the full 3D interactive viewer in Engine3DViewer directly
      case 2: return <AiAnalyticsTab />;
      case 3: return <SimulatorTab sendCommand={sendCommand} />;
      case 4: return <LogsTab />;
      case 5: return <EnvironmentalTab />;
      case 6: return <MissionPlanningTab />;
      case 7: return <FlightDynamicsTab />;
      case 8: return <TacticalMapTab />;
      default: return <TelemetryTab />;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden text-sm bg-gray-950 font-mono">
      {/* Z-10: 3D Digital Twin Viewer (Full interactive background) */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <Engine3DViewer />
      </div>

      {/* Z-20: App Tactical HUD Layer */}
      <div className="absolute inset-0 z-20 flex flex-col pointer-events-none">
        <div className="pointer-events-auto w-full shrink-0">
          <GlobalHeader />
        </div>
        
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="pointer-events-auto h-full shrink-0">
            <Sidebar />
          </div>
          
          <main className="flex-1 h-full p-4 overflow-y-auto pointer-events-none min-w-0">
            <div className={`min-h-full pb-10 ${activePanel !== 1 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
              {renderActiveTab()}
            </div>
          </main>
        </div>
      </div>

      {/* Z-50: Critical Alert Manager */}
      <AlertManager sendCommand={sendCommand} />
    </div>
  );
}
