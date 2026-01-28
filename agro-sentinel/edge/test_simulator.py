import unittest
from simulator import GreenhouseSimulator

class TestGreenhouseSimulator(unittest.TestCase):
    def setUp(self):
        self.sim = GreenhouseSimulator("TEST-GH")

    def test_data_structure(self):
        data = self.sim.get_data()
        self.assertIn("sensor_id", data)
        self.assertEqual(data["sensor_id"], "TEST-GH")
        self.assertIn("temperature_c", data)
        self.assertIn("humidity_rh", data)
        self.assertIn("timestamp", data)

    def test_value_ranges(self):
        # Run multiple iterations to check random ranges
        for _ in range(100):
            data = self.sim.get_data()
            self.assertTrue(0 <= data["humidity_rh"] <= 100, f"Humidity out of range: {data['humidity_rh']}")
            self.assertTrue(0 <= data["co2_ppm"], "CO2 cannot be negative")
            self.assertTrue(0 <= data["par_umol"], "PAR cannot be negative")
            self.assertTrue(0 <= data["battery_level"] <= 100, "Battery out of range")
            self.assertIsInstance(data["temperature_c"], float)

if __name__ == '__main__':
    unittest.main()
