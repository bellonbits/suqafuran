import unittest
from app.services.africastalking_service import africastalking_service

class TestLoginNormalization(unittest.TestCase):
    def test_normalization(self):
        test_cases = [
            ("0706070747", "+254706070747"),
            ("254706070747", "+254706070747"),
            ("+254706070747", "+254706070747"),
        ]
        
        for input_phone, expected in test_cases:
            normalized = africastalking_service.normalize_phone(input_phone)
            print(f"Input: {input_phone} -> Result: {normalized}")
            self.assertEqual(normalized, expected)

if __name__ == "__main__":
    unittest.main()
