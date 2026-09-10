import asyncio
import json
import random
import time
import math
import sqlite3
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EngineSimulation:
    def __init__(self):
        # Actuators
        self.throttle = 0.0 # 0 to 100
        self.mixture = 50.0 # 0 to 100
        self.propPitch = 100.0 # 0 to 100
        self.fuelSelector = 'BOTH' # 'BOTH', 'LEFT', 'RIGHT', 'OFF'
        self.carbHeat = False
        self.antiIce = False
        self.generatorSwitch = True
        self.autopilot = False
        self.flaps = 0.0 # 0 to 40 degrees
        self.gearDown = True
        self.avionicsFan = True
        self.hydPump = True

        # Faults
        self.faults = {
            "cyl2Overheat": False,
            "oilLineRupture": False,
            "mainBearingWear": False,
            "propGovernorFail": False,
            "carbIcingEvent": False,
            "alternatorFailure": False,
            "coolantLeakMajor": False,
            "propStrike": False,
            "hydLeak": False,
            "avionicsOverheat": False,
        }

        # Telemetry State
        self.rpm = 0.0
        self.chts = [100.0, 100.0, 100.0, 100.0]
        self.egts = [200.0, 200.0, 200.0, 200.0]
        self.oilPressure = 4.5
        self.oilTemp = 80.0
        self.crankcasePressure = 1.0
        
        # Hydraulics & Avionics
        self.hydPressure = 3000.0 # psi
        self.hydTemp = 40.0
        self.avionicsTemp = 30.0
        
        # Electrical
        self.batteryVoltage = 24.0
        self.batteryAmps = 0.0
        self.generatorLoad = 0.0
        
        # Forced Induction
        self.turboBoostPressure = 0.0
        self.intercoolerTemp = 30.0
        
        # Environmental
        self.ambientTemp = 15.0
        self.ambientPressure = 1013.25
        self.densityAltitude = 0.0
        self.windSpeed = 0.0
        self.windDir = 0.0
        self.iceRisk = 0.0
        
        # Attitude / Flight Dynamics
        self.pitchAngle = 0.0
        self.rollAngle = 0.0
        self.yawRate = 0.0
        
        # Spatial Coordinates (Tactical Map)
        self.latitude = 37.7749
        self.longitude = -122.4194
        self.heading = 45.0
        self.groundSpeed = 0.0
        self.gLoad = 1.0
        
        # Fuel
        self.fuelLevelL = 50.0
        self.fuelLevelR = 50.0
        self.fuelUsedTotal = 0.0
        
        # AI & Prognostics
        self.anomalyScore = 0.05
        self.componentWear = {
            "cyl1": 0.01,
            "cyl2": 0.01,
            "cyl3": 0.01,
            "cyl4": 0.01,
            "oilPump": 0.02,
            "alternator": 0.01,
            "turbo": 0.03,
            "propGovernor": 0.01,
            "bearings": 0.05,
            "fuelPump": 0.02
        }

        self.last_update = time.time()

    def update(self):
        dt = time.time() - self.last_update
        self.last_update = time.time()

        # Engine Physics Model
        target_rpm = (self.throttle / 100.0) * 5500.0
        if self.fuelSelector == 'OFF' or (self.fuelLevelL <= 0 and self.fuelLevelR <= 0):
            target_rpm = 0.0

        if self.faults["propStrike"]:
            target_rpm = 0.0

        # Prop Governor
        if not self.faults["propGovernorFail"]:
            # Simple prop governor simulation: pitch affects RPM response
            target_rpm = target_rpm * (self.propPitch / 100.0 + 0.2)

        # Smooth RPM transition
        self.rpm += (target_rpm - self.rpm) * 0.1

        # CHTs and EGTs based on RPM and Mixture
        base_cht = 100.0 + (self.rpm / 5500.0) * 120.0
        base_egt = 200.0 + (self.rpm / 5500.0) * 600.0
        
        # Mixture effect (peak EGT near 50%)
        mixture_effect = 1.0 - abs(self.mixture - 50.0) / 100.0
        base_egt += mixture_effect * 100.0
        
        for i in range(4):
            self.chts[i] += (base_cht - self.chts[i]) * 0.02 + random.uniform(-0.5, 0.5)
            self.egts[i] += (base_egt - self.egts[i]) * 0.05 + random.uniform(-2.0, 2.0)

        # Fault effects
        if self.faults["cyl2Overheat"]:
            self.chts[1] += 2.0  # Rapid increase
            if self.chts[1] > 250.0:
                self.chts[1] = 250.0

        # Oil System
        target_oil_pressure = 1.0 + (self.rpm / 5500.0) * 4.0
        if self.faults["oilLineRupture"]:
            target_oil_pressure = 0.2 # Dropping rapidly
        
        self.oilPressure += (target_oil_pressure - self.oilPressure) * 0.1 + random.uniform(-0.05, 0.05)
        self.oilTemp += ((base_cht - 50) - self.oilTemp) * 0.01

        # Electrical
        if self.faults["alternatorFailure"] or not self.generatorSwitch:
            self.batteryVoltage -= 0.01 * dt # Battery drain
            self.generatorLoad = 0.0
        else:
            self.batteryVoltage = min(28.0, self.batteryVoltage + 0.1 * dt)
            self.generatorLoad = 45.0 + random.uniform(-2, 2)
        
        if self.batteryVoltage < 18.0: # Very dead battery
             pass # Could trigger other failures

        # Fuel Drain
        fuel_rate = (self.rpm / 5500.0) * 0.01 * dt
        if self.fuelSelector == 'BOTH':
            if self.fuelLevelL > 0: self.fuelLevelL -= fuel_rate / 2
            if self.fuelLevelR > 0: self.fuelLevelR -= fuel_rate / 2
            self.fuelUsedTotal += fuel_rate
        elif self.fuelSelector == 'LEFT' and self.fuelLevelL > 0:
            self.fuelLevelL -= fuel_rate
            self.fuelUsedTotal += fuel_rate
        elif self.fuelSelector == 'RIGHT' and self.fuelLevelR > 0:
            self.fuelLevelR -= fuel_rate
            self.fuelUsedTotal += fuel_rate

        # Hydraulics
        target_hyd = 3000.0 if self.hydPump and self.batteryVoltage > 20.0 else 0.0
        if self.faults["hydLeak"]:
            target_hyd = 200.0
        self.hydPressure += (target_hyd - self.hydPressure) * 0.1 + random.uniform(-10, 10)
        self.hydTemp += ((40 + (self.hydPressure / 3000)*20) - self.hydTemp) * 0.05
        
        # Avionics
        target_av_temp = 50.0 if not self.avionicsFan else 30.0
        if self.faults["avionicsOverheat"]:
            target_av_temp = 85.0
        self.avionicsTemp += (target_av_temp - self.avionicsTemp) * 0.02 + random.uniform(-0.1, 0.1)

        # Advanced AI Prognostics & Dynamic RUL Calculation
        # Nominal RUL is ~1420 hours. When catastrophic faults hit, RUL crashes mathematically to minutes.
        base_rul_hours = 1420.0 - (self.componentWear["bearings"] * 2000.0)
        
        # Fault impact on RUL
        if self.faults["oilLineRupture"] or self.oilPressure < 1.0:
            # Engine seizure imminent in 3 to 10 minutes without oil
            time_to_seizure_hours = max(0.05, (self.oilPressure / 4.5) * 0.18) # ~3 to 10 mins
            self.rulHours = min(base_rul_hours, time_to_seizure_hours)
            self.componentWear["bearings"] = min(1.0, self.componentWear["bearings"] + 0.002 * dt)
            self.componentWear["oilPump"] = min(1.0, self.componentWear["oilPump"] + 0.003 * dt)
        elif self.faults["cyl2Overheat"] or self.chts[1] > 230:
            # Thermal piston ring breakdown in ~2-4 hours
            self.rulHours = min(base_rul_hours, 3.2 - ((self.chts[1] - 230) / 20.0) * 2.0)
            self.componentWear["cyl2"] = min(1.0, self.componentWear["cyl2"] + 0.001 * dt)
        elif self.faults["mainBearingWear"]:
            self.rulHours = min(base_rul_hours, 18.5)
            self.componentWear["bearings"] = min(1.0, self.componentWear["bearings"] + 0.0005 * dt)
        elif self.faults["hydLeak"]:
            self.rulHours = min(base_rul_hours, 45.0)
            self.componentWear["hydraulics"] = min(1.0, self.componentWear["hydraulics"] + 0.001 * dt)
        elif self.faults["alternatorFailure"]:
            # Battery endurance ~45 mins
            battery_pct = max(0.0, (self.batteryVoltage - 18.0) / 10.0)
            self.rulHours = min(base_rul_hours, battery_pct * 0.85)
            self.componentWear["alternator"] = min(1.0, self.componentWear["alternator"] + 0.001 * dt)
        else:
            # Nominal degradation based on RPM & power output
            rpm_factor = 1.0 + (self.rpm / 5500.0) ** 2 * 2.0
            self.rulHours = max(10.0, base_rul_hours - (rpm_factor * 0.0001 * dt))

        # Environmental Dynamics (simulate flying through atmosphere)
        base_alt = 8500.0
        self.ambientTemp = 15.0 - (base_alt / 1000.0) * 1.98 + random.uniform(-0.1, 0.1)
        self.ambientPressure = 1013.25 * math.pow(1 - 2.25577e-5 * base_alt, 5.25588) + random.uniform(-0.5, 0.5)
        self.densityAltitude = base_alt + 120 * (self.ambientTemp - (15.0 - (base_alt / 1000.0) * 1.98)) + random.uniform(-5, 5)
        
        target_wind = 12.0
        self.windSpeed += (target_wind - self.windSpeed) * 0.05 + random.uniform(-0.5, 0.5)
        self.windSpeed = max(0, self.windSpeed)
        
        target_wind_dir = 275.0
        self.windDir += (target_wind_dir - self.windDir) * 0.02 + random.uniform(-1.0, 1.0)
        self.windDir = self.windDir % 360
        
        target_ice = 0.0
        if self.ambientTemp < 5.0 and self.ambientTemp > -15.0:
            target_ice = 0.65 if self.faults["carbIcingEvent"] else 0.15
        elif self.faults["carbIcingEvent"]:
            target_ice = 0.85
        self.iceRisk += (target_ice - self.iceRisk) * 0.05 + random.uniform(-0.01, 0.01)
        self.iceRisk = min(1.0, max(0.0, self.iceRisk))

        # Dynamic AI Anomaly Score (0.0 to 1.0)
        
        # Flight Dynamics (PFD / Synthetic Vision)
        target_pitch = 0.0
        target_roll = 0.0
        target_yaw_rate = 0.0
        
        # Simulate gentle banking and pitching based on wind and speed
        if self.rpm > 2000:
            self.groundSpeed += (120.0 - self.groundSpeed) * 0.01 + random.uniform(-0.5, 0.5)
            # Gentle turn simulation
            self.heading += 0.5 * dt
            self.heading = self.heading % 360
            
            target_roll = 15.0 * math.sin(time.time() * 0.2) + random.uniform(-2.0, 2.0)
            target_pitch = 2.0 * math.cos(time.time() * 0.1) + random.uniform(-1.0, 1.0)
            target_yaw_rate = 0.5 + random.uniform(-0.1, 0.1)
            
            # Spatial movement (very simple flat-earth approx for loiter)
            self.latitude += (self.groundSpeed * 0.0000005) * math.cos(math.radians(self.heading))
            self.longitude += (self.groundSpeed * 0.0000005) * math.sin(math.radians(self.heading))
        else:
            self.groundSpeed *= 0.95
            target_roll = random.uniform(-0.5, 0.5)
            target_pitch = random.uniform(-0.5, 0.5)

        self.pitchAngle += (target_pitch - self.pitchAngle) * 0.1
        self.rollAngle += (target_roll - self.rollAngle) * 0.1
        self.yawRate += (target_yaw_rate - self.yawRate) * 0.1

        target_anomaly = 0.03
        if self.faults["oilLineRupture"] or self.oilPressure < 1.5:
            target_anomaly += 0.85
        if self.faults["cyl2Overheat"] or self.chts[1] > 220:
            target_anomaly += 0.70
        if self.faults["mainBearingWear"]:
            target_anomaly += 0.50
        if self.faults["hydLeak"] or self.hydPressure < 1800:
            target_anomaly += 0.40
        if self.faults["alternatorFailure"] or self.batteryVoltage < 22:
            target_anomaly += 0.45
        if self.faults["carbIcingEvent"]:
            target_anomaly += 0.35
        if self.faults["propGovernorFail"]:
            target_anomaly += 0.40
            
        target_anomaly = min(0.99, max(0.02, target_anomaly + random.uniform(-0.02, 0.02)))
        self.anomalyScore += (target_anomaly - self.anomalyScore) * 0.15
        
        # Component Wear accumulation
        if self.rpm > 5000:
            self.componentWear["bearings"] = min(1.0, self.componentWear["bearings"] + 0.00005)
            self.componentWear["oilPump"] = min(1.0, self.componentWear["oilPump"] + 0.00003)
            self.componentWear["turbo"] = min(1.0, self.componentWear["turbo"] + 0.00004)

    def get_state(self) -> dict:
        return {
            "timestamp": time.time(),
            "rpm": self.rpm,
            "chts": self.chts,
            "egts": self.egts,
            "oilPressure": self.oilPressure,
            "oilTemp": self.oilTemp,
            "crankcasePressure": self.crankcasePressure,
            "hydPressure": self.hydPressure,
            "hydTemp": self.hydTemp,
            "avionicsTemp": self.avionicsTemp,
            "batteryVoltage": self.batteryVoltage,
            "batteryAmps": self.batteryAmps,
            "generatorLoad": self.generatorLoad,
            "turboBoostPressure": self.turboBoostPressure,
            "intercoolerTemp": self.intercoolerTemp,
            "ambientTemp": self.ambientTemp,
            "ambientPressure": self.ambientPressure,
            "densityAltitude": self.densityAltitude,
            "windSpeed": self.windSpeed,
            "windDir": self.windDir,
            "iceRisk": self.iceRisk,
            "pitchAngle": self.pitchAngle,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "heading": self.heading,
            "groundSpeed": self.groundSpeed,
            "rollAngle": self.rollAngle,
            "yawRate": self.yawRate,
            "gLoad": self.gLoad,
            "fuelLevelL": self.fuelLevelL,
            "fuelLevelR": self.fuelLevelR,
            "fuelUsedTotal": self.fuelUsedTotal,
            "anomalyScore": self.anomalyScore,
            "rulHours": getattr(self, 'rulHours', 1420.0),
            "componentWear": self.componentWear,
            "faults": self.faults,
            "actuators": {
                "throttle": self.throttle,
                "mixture": self.mixture,
                "propPitch": self.propPitch,
                "fuelSelector": self.fuelSelector,
                "carbHeat": self.carbHeat,
                "antiIce": self.antiIce,
                "generatorSwitch": self.generatorSwitch,
                "autopilot": self.autopilot,
                "flaps": self.flaps,
                "gearDown": self.gearDown,
                "avionicsFan": self.avionicsFan,
                "hydPump": self.hydPump,
            }
        }


# SQLite DB Setup
db_queue = []
def init_db():
    conn = sqlite3.connect("blackbox.db")
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            payload JSON
        )
    ''')
    conn.commit()
    conn.close()

init_db()

async def db_writer_loop():
    while True:
        if db_queue:
            batch = db_queue[:]
            db_queue.clear()
            try:
                conn = sqlite3.connect("blackbox.db")
                c = conn.cursor()
                c.executemany("INSERT INTO telemetry (timestamp, payload) VALUES (?, ?)", batch)
                conn.commit()
                conn.close()
            except Exception as e:
                print("DB Error:", e)
        await asyncio.sleep(1.0)


sim = EngineSimulation()
clients: List[WebSocket] = []

@app.websocket("/ws/twin")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                command = json.loads(data)
                cmd_type = command.get("type")
                payload = command.get("payload", {})

                if cmd_type == "setActuator":
                    key = payload.get("key")
                    val = payload.get("value")
                    if hasattr(sim, key):
                        setattr(sim, key, val)
                
                elif cmd_type == "setFault":
                    key = payload.get("key")
                    val = payload.get("value")
                    if key in sim.faults:
                        sim.faults[key] = val
                        
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        clients.remove(websocket)

async def simulation_loop():
    while True:
        sim.update()
        state = sim.get_state()
        state_json = json.dumps({"type": "telemetry", "payload": state})
        
        disconnected = []
        for client in clients:
            try:
                await client.send_text(state_json)
            except Exception:
                disconnected.append(client)
                
        for client in disconnected:
            clients.remove(client)
            
        # Write to SQLite db via queue
        db_queue.append((state["timestamp"], state_json))
            
        await asyncio.sleep(0.1) # 10Hz

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())
    asyncio.create_task(db_writer_loop())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
