import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { Eye, Layers, Crosshair, Zap, ZoomIn, ZoomOut, RotateCcw, Compass } from 'lucide-react';

function EngineAssembly({ wireframeMode, xRayMode, selectedPart, onSelectPart }) {
  const { telemetry } = useTelemetryStore();
  const propGroupRef = useRef();
  const crankRef = useRef();

  useFrame((state, delta) => {
    if (telemetry && telemetry.rpm > 0) {
      const rotSpeed = (telemetry.rpm / 60) * Math.PI * 2 * delta * 0.2;
      if (propGroupRef.current) {
        propGroupRef.current.rotation.z -= rotSpeed;
      }
      if (crankRef.current) {
        crankRef.current.rotation.x += rotSpeed * 0.5;
      }
    }
  });

  const getCylColor = (index) => {
    if (!telemetry) return '#00f0ff';
    const temp = telemetry.chts[index] || 100;
    if (temp > 240) return '#ff003c';
    if (temp > 180) return '#facc15';
    return '#00f0ff';
  };

  const getCylEmissive = (index) => {
    if (!telemetry) return 0.5;
    const temp = telemetry.chts[index] || 100;
    return temp > 240 ? 3.0 : temp > 180 ? 1.5 : 0.6;
  };

  const isOilWarning = telemetry?.oilPressure < 1.5;
  const isHydWarning = telemetry?.hydPressure < 1500;

  return (
    <group position={[0, -0.2, 0]}>
      {/* Crankcase / Main Engine Core */}
      <mesh 
        position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectPart('CRANKCASE / BLOCK'); }}
      >
        <boxGeometry args={[1.3, 1.4, 2.6]} />
        <meshStandardMaterial 
          color={selectedPart === 'CRANKCASE / BLOCK' ? '#00f0ff' : '#0f172a'} 
          metalness={0.85} 
          roughness={0.25} 
          wireframe={wireframeMode}
          transparent={xRayMode}
          opacity={xRayMode ? 0.35 : 0.95}
          emissive="#0ea5e9"
          emissiveIntensity={selectedPart === 'CRANKCASE / BLOCK' ? 0.8 : 0.15}
        />
      </mesh>

      {/* Oil Sump / Lubrication Pan */}
      <mesh 
        position={[0, -0.85, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectPart('OIL SUMP & PUMP'); }}
      >
        <boxGeometry args={[1.1, 0.4, 2.2]} />
        <meshStandardMaterial 
          color={isOilWarning ? '#ff003c' : '#0ea5e9'} 
          metalness={0.9} 
          roughness={0.2}
          wireframe={wireframeMode}
          emissive={isOilWarning ? '#ff003c' : '#0ea5e9'}
          emissiveIntensity={isOilWarning ? 2.0 : 0.3}
        />
      </mesh>

      {/* Hydraulic Power Unit / Pump */}
      <mesh 
        position={[0.75, -0.4, -0.6]} 
        rotation={[0, 0, Math.PI / 4]}
        onClick={(e) => { e.stopPropagation(); onSelectPart('HYDRAULIC PUMP UNIT'); }}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
        <meshStandardMaterial 
          color={isHydWarning ? '#ff003c' : '#38bdf8'} 
          metalness={0.9} 
          roughness={0.3}
          wireframe={wireframeMode}
          emissive={isHydWarning ? '#ff003c' : '#0284c7'}
          emissiveIntensity={isHydWarning ? 2.5 : 0.5}
        />
      </mesh>

      {/* Alternator / Generator Unit */}
      <mesh 
        position={[-0.75, -0.4, -0.6]} 
        rotation={[0, 0, -Math.PI / 4]}
        onClick={(e) => { e.stopPropagation(); onSelectPart('ALTERNATOR / 28V BUS'); }}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.5, 16]} />
        <meshStandardMaterial 
          color={telemetry?.faults.alternatorFailure ? '#ff003c' : '#00f0ff'} 
          metalness={0.8} 
          roughness={0.2}
          wireframe={wireframeMode}
          emissive={telemetry?.faults.alternatorFailure ? '#ff003c' : '#00f0ff'}
          emissiveIntensity={telemetry?.faults.alternatorFailure ? 2.0 : 0.4}
        />
      </mesh>

      {/* Turbocharger Assembly */}
      <mesh 
        position={[0, 0.85, -1.0]} 
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelectPart('TURBOCHARGER & INTAKE'); }}
      >
        <torusGeometry args={[0.35, 0.12, 16, 32]} />
        <meshStandardMaterial 
          color="#f59e0b" 
          metalness={0.95} 
          roughness={0.15}
          wireframe={wireframeMode}
          emissive="#f59e0b"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Cylinders 1 through 4 */}
      {[0, 1, 2, 3].map((i) => {
        const isLeft = i % 2 === 0;
        const zPos = -0.75 + Math.floor(i / 2) * 1.5;
        const xPos = isLeft ? -0.85 : 0.85;
        const partName = `CYLINDER ${i + 1} (${isLeft ? 'PORT' : 'STARBOARD'})`;
        const isSelected = selectedPart === partName;
        
        return (
          <group key={i} position={[xPos, 0.1, zPos]}>
            {/* Cylinder Body */}
            <mesh 
              rotation={[0, 0, isLeft ? Math.PI / 2 : -Math.PI / 2]}
              onClick={(e) => { e.stopPropagation(); onSelectPart(partName); }}
            >
              <cylinderGeometry args={[0.42, 0.42, 0.7, 24]} />
              <meshStandardMaterial 
                color={getCylColor(i)} 
                emissive={getCylColor(i)} 
                emissiveIntensity={isSelected ? 3.0 : getCylEmissive(i)} 
                wireframe={wireframeMode}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>

            {/* Cylinder Cooling Fins Ring */}
            <mesh rotation={[0, 0, isLeft ? Math.PI / 2 : -Math.PI / 2]}>
              <cylinderGeometry args={[0.46, 0.46, 0.5, 16]} />
              <meshStandardMaterial 
                color={getCylColor(i)} 
                wireframe={true}
                transparent={true}
                opacity={0.4}
              />
            </mesh>
          </group>
        );
      })}

      {/* Propeller Gearbox & Hub */}
      <group position={[0, 0, 1.55]}>
        <mesh 
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelectPart('REDUCTION GEARBOX'); }}
        >
          <cylinderGeometry args={[0.3, 0.45, 0.6, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} emissive="#0ea5e9" emissiveIntensity={0.4} />
        </mesh>

        {/* Rotating Prop Hub & Blades */}
        <group ref={propGroupRef} position={[0, 0, 0.35]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.25, 20]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.8} />
          </mesh>

          {/* 3 Carbon Blades */}
          {[0, 120, 240].map((deg, idx) => (
            <group key={idx} rotation={[0, 0, (deg * Math.PI) / 180]}>
              <mesh position={[0, 1.4, 0]}>
                <boxGeometry args={[0.16, 2.5, 0.03]} />
                <meshStandardMaterial 
                  color="#00f0ff" 
                  emissive="#00f0ff" 
                  emissiveIntensity={0.6}
                  transparent={true}
                  opacity={telemetry?.rpm > 200 ? 0.4 : 0.9}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function Engine3DViewer() {
  const { telemetry, activePanel } = useTelemetryStore();
  const controlsRef = useRef();
  const containerRef = useRef(null);
  
  const [wireframeMode, setWireframeMode] = useState(false);
  const [xRayMode, setXRayMode] = useState(false);
  const [selectedPart, setSelectedPart] = useState('CYLINDER 2 (STARBOARD)');

  const setCameraPreset = (type) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    
    if (type === 'ISO') {
      controls.object.position.set(4, 3, 5);
    } else if (type === 'FRONT') {
      controls.object.position.set(0, 0, 5.5);
    } else if (type === 'TOP') {
      controls.object.position.set(0, 6.5, 0.1);
    } else if (type === 'SIDE') {
      controls.object.position.set(5.5, 0.5, 0);
    }
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const handleZoom = (delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const cam = controls.object;
    const factor = delta > 0 ? 0.85 : 1.15;
    cam.position.multiplyScalar(factor);
    controls.update();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      {/* 3D Canvas with OrbitControls */}
      <Canvas 
        camera={{ position: [4, 3, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.6} color="#00f0ff" />
        <pointLight position={[0, 5, 0]} intensity={1.2} color="#00f0ff" />
        <pointLight position={[0, -3, 0]} intensity={0.8} color="#0ea5e9" />
        
        <EngineAssembly 
          wireframeMode={wireframeMode}
          xRayMode={xRayMode}
          selectedPart={selectedPart}
          onSelectPart={setSelectedPart}
        />
        
        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>

        <OrbitControls 
          ref={controlsRef}
          makeDefault
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.3}
          minDistance={1.2}
          maxDistance={20}
          zoomSpeed={1.2}
          rotateSpeed={0.85}
          panSpeed={0.85}
        />
      </Canvas>

      {/* Interactive Overlay for Tab 1 (Offset cleanly below Top Header 50px & Sidebar 72px) */}
      {activePanel === 1 && (
        <div className="absolute inset-0 pointer-events-none pt-[62px] pb-4 pl-[84px] pr-4 flex flex-col justify-between z-20">
          {/* Top Bar: Camera Presets & Zoom Controls (Positioned safely below header and right of sidebar) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
            <div className="bg-gray-950/90 backdrop-blur-md border border-holo/30 px-3 py-1.5 rounded flex items-center space-x-2 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <Crosshair size={15} className="text-holo animate-pulse" />
              <span className="font-mono text-xs text-holo font-bold">DIGITAL TWIN 3D INSPECTOR</span>
            </div>

            <div className="bg-gray-950/90 backdrop-blur-md border border-holo/30 p-1.5 rounded flex items-center space-x-1.5 font-mono text-xs shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <button 
                onClick={() => setCameraPreset('ISO')} 
                className="px-2.5 py-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors text-[11px]"
              >
                ISO
              </button>
              <button 
                onClick={() => setCameraPreset('FRONT')} 
                className="px-2.5 py-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors text-[11px]"
              >
                FRONT
              </button>
              <button 
                onClick={() => setCameraPreset('TOP')} 
                className="px-2.5 py-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors text-[11px]"
              >
                TOP
              </button>
              <button 
                onClick={() => setCameraPreset('SIDE')} 
                className="px-2.5 py-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors text-[11px]"
              >
                PORT
              </button>
              
              <div className="h-4 w-px bg-holo/30 mx-1" />

              {/* Dedicated Mouse & Trackpad Zoom Buttons */}
              <button 
                onClick={() => handleZoom(1)} 
                className="p-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button 
                onClick={() => handleZoom(-1)} 
                className="p-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <button 
                onClick={() => setCameraPreset('ISO')} 
                className="p-1 border border-holo/40 text-holo hover:bg-holo/25 rounded transition-colors"
                title="Reset View"
              >
                <RotateCcw size={13} />
              </button>

              <div className="h-4 w-px bg-holo/30 mx-1" />

              <button 
                onClick={() => setWireframeMode(!wireframeMode)} 
                className={`px-2.5 py-1 border rounded flex items-center space-x-1 transition-colors text-[11px] ${wireframeMode ? 'border-plasma text-plasma bg-plasma/20' : 'border-holo/40 text-holo hover:bg-holo/25'}`}
              >
                <Layers size={12} />
                <span>WIREFRAME</span>
              </button>

              <button 
                onClick={() => setXRayMode(!xRayMode)} 
                className={`px-2.5 py-1 border rounded flex items-center space-x-1 transition-colors text-[11px] ${xRayMode ? 'border-amber-400 text-amber-400 bg-amber-400/20' : 'border-holo/40 text-holo hover:bg-holo/25'}`}
              >
                <Eye size={12} />
                <span>X-RAY</span>
              </button>
            </div>
          </div>

          {/* Bottom Component Diagnostics Card & Telemetry Pill */}
          <div className="flex flex-wrap items-end justify-between gap-3 pointer-events-auto">
            <div className="w-full sm:w-[360px] bg-gray-950/90 backdrop-blur-md border border-holo/40 p-3.5 rounded shadow-[0_0_20px_rgba(0,240,255,0.2)] font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-holo/20 mb-2.5">
                <span className="text-holo font-bold uppercase tracking-wider flex items-center text-xs">
                  <Zap size={13} className="mr-1.5 text-holo" /> {selectedPart}
                </span>
                <span className="text-[10px] text-gray-400">TELEMETRY SYNCED</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                <div className="bg-gray-900/80 p-2 rounded border border-holo/15">
                  <div className="text-gray-400 text-[10px]">OPERATING TEMP</div>
                  <div className="text-holo font-bold text-sm">
                    {selectedPart.includes('CYLINDER 2') ? `${telemetry?.chts[1]?.toFixed(1)} deg C` : 
                     selectedPart.includes('CYLINDER 1') ? `${telemetry?.chts[0]?.toFixed(1)} deg C` : 
                     selectedPart.includes('CYLINDER 3') ? `${telemetry?.chts[2]?.toFixed(1)} deg C` : 
                     selectedPart.includes('CYLINDER 4') ? `${telemetry?.chts[3]?.toFixed(1)} deg C` : 
                     selectedPart.includes('OIL') ? `${telemetry?.oilTemp?.toFixed(1)} deg C` :
                     selectedPart.includes('HYDRAULIC') ? `${telemetry?.hydTemp?.toFixed(1)} deg C` : '42.0 deg C'}
                  </div>
                </div>

                <div className="bg-gray-900/80 p-2 rounded border border-holo/15">
                  <div className="text-gray-400 text-[10px]">DYNAMIC PRESSURE</div>
                  <div className="text-holo font-bold text-sm">
                    {selectedPart.includes('OIL') ? `${telemetry?.oilPressure?.toFixed(2)} BAR` : 
                     selectedPart.includes('HYDRAULIC') ? `${telemetry?.hydPressure?.toFixed(0)} PSI` : 
                     selectedPart.includes('TURBO') ? `${telemetry?.turboBoostPressure?.toFixed(1)} BAR` : '1.02 BAR'}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 bg-gray-900/50 p-2 rounded border border-holo/10 flex items-center justify-between">
                <span>Drag mouse/trackpad to orbit • Scroll/pinch to zoom</span>
              </div>
            </div>

            {/* Quick Engine Telemetry Bar */}
            <div className="bg-gray-950/90 backdrop-blur-md border border-holo/30 px-4 py-2 rounded flex items-center space-x-4 font-mono text-xs shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <div>RPM: <span className="text-holo font-bold">{Math.round(telemetry?.rpm || 0)}</span></div>
              <div className="h-3 w-px bg-holo/30" />
              <div>THR: <span className="text-holo font-bold">{telemetry?.actuators?.throttle?.toFixed(0)}%</span></div>
              <div className="h-3 w-px bg-holo/30" />
              <div>OIL: <span className={`font-bold ${telemetry?.oilPressure < 1.5 ? 'text-plasma' : 'text-holo'}`}>{telemetry?.oilPressure?.toFixed(1)} BAR</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
