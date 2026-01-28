import unittest
from unittest.mock import MagicMock, patch
import os
import sys

# Set environment variable to force mock usage BEFORE importing thermal
os.environ['USE_MOCK_GCP'] = 'true'

# Import the module under test
import thermal

class TestThermalProcessing(unittest.TestCase):
    
    def setUp(self):
        # Reset mocks if any
        pass

    def test_process_thermal_image_success(self):
        # Mock Cloud Event
        mock_event = MagicMock()
        mock_event.data = {
            "bucket": "test-bucket",
            "name": "GH-AMB-01_2026-01-20.jpg",
            "timeCreated": "2026-01-20T12:00:00Z"
        }
        
        # Capture logs
        with self.assertLogs(level='INFO') as cm:
            thermal.process_thermal_image(mock_event)
            
        # Verify Analysis Result log
        self.assertTrue(any("AI Analysis Result" in log for log in cm.output))
        
        # Verify Firestore writes (Mock)
        # We can check if the mock print statements appeared in stdout if we captured it, 
        # but since we are using our custom mock_gcp, it prints to stdout.
        # A better way is to inspect the 'db' object if we can access it,
        # but mock_gcp.Client returns separate instances.
        # For this simple test, ensuring no exception and correct logs is a good start.

    def test_skip_non_image(self):
        mock_event = MagicMock()
        mock_event.data = {
            "bucket": "test-bucket",
            "name": "not-an-image.txt"
        }
        
        with self.assertLogs(level='INFO') as cm:
            thermal.process_thermal_image(mock_event)
            
        self.assertTrue(any("skipping" in log for log in cm.output))

if __name__ == '__main__':
    unittest.main()
