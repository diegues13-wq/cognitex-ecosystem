import random
import math
import json
from datetime import datetime, timezone

class GreenhouseSimulator:
    def __init__(self, greenhouse_id="GH-001"):
        self.greenhouse_id = greenhouse_id
        self.base_temp = 20.0
        self.base_humidity = 60.0
        self.base_co2 = 450.0 # Ambient CO2
        self.base_par = 0.0   # Night time start
        
    def get_data(self):
        """Simulate sensor readings with realistic fluctuations."""
        # Simulate day/night cycle for temperature using sine wave based on current hour
        current_hour = datetime.now().hour
        is_day = 6 <= current_hour <= 18
        
        # Temperature Logic
        temp_fluctuation = 5 * math.sin((current_hour - 6) * math.pi / 12) 
        noise_temp = random.uniform(-0.5, 0.5)
        temperature = self.base_temp + temp_fluctuation + noise_temp

        # Humidity often inverse to temperature
        humidity_fluctuation = -5 * math.sin((current_hour - 6) * math.pi / 12)
        noise_hum = random.uniform(-2, 2)
        humidity = max(0, min(100, self.base_humidity + humidity_fluctuation + noise_hum))

        # CO2 Logic: Plants consume CO2 during day (drop) and respire at night (rise)
        # However, greenhouses often supplement CO2 during day. Let's simulate depletion without enrichment.
        co2_variation = -50 if is_day else 20
        co2_noise = random.uniform(-10, 10)
        co2 = max(300, self.base_co2 + co2_variation + co2_noise)

        # PAR (Light) Logic: High during day (parabolic), zero at night
        if is_day:
             # Peak at noon (hour 12)
             par_intensity = 2000 * math.sin((current_hour - 6) * math.pi / 12)
             par = max(0, par_intensity + random.uniform(-50, 50))
        else:
             par = 0

        # Soil EC: Very stable
        soil_ec = random.uniform(1.2, 1.8) # dS/m standard for substrates

        return {
            "sensor_id": self.greenhouse_id,
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "temperature_c": round(temperature, 2),
            "humidity_rh": round(humidity, 2),
            "soil_moisture": round(random.uniform(30, 45), 1),
            "co2_ppm": round(co2, 0),
            "par_umol": round(par, 0),
            "soil_ec": round(soil_ec, 2),
            "battery_level": round(random.uniform(90, 100), 1)
        }

if __name__ == "__main__":
    sim = GreenhouseSimulator()
    print(json.dumps(sim.get_data(), indent=2))
