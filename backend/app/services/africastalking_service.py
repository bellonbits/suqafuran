import africastalking
import secrets
import redis
from typing import Optional
from app.core.config import settings

class AfricasTalkingService:
    def __init__(self):
        self.username = settings.AFRICASTALKING_USERNAME
        self.api_key = settings.AFRICASTALKING_API_KEY
        self.sender_id = settings.AFRICASTALKING_SENDER_ID
        self.environment = settings.ENVIRONMENT
        
        print(f"[AT Init] Username: {self.username}")
        print(f"[AT Init] API Key present: {bool(self.api_key)}")
        print(f"[AT Init] API Key length: {len(self.api_key) if self.api_key else 0}")
        print(f"[AT Init] Sender ID: {self.sender_id}")
        print(f"[AT Init] Environment: {self.environment}")
        
        if self.username and self.api_key:
            try:
                africastalking.initialize(self.username, self.api_key)
                self.sms = africastalking.SMS
                print(f"[AT Init] Successfully initialized with username: {self.username}")
            except Exception as e:
                print(f"[AT Init] Initialization error: {e}")
                self.sms = None
        else:
            print("[AT Init] Missing credentials, SMS disabled")
            self.sms = None
            
        # Initialize Redis for OTP storage
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            print("[AT Init] Redis connected successfully")
        except Exception as e:
            print(f"[AT Init] Redis connection error: {e}")
            self.redis = None

    def normalize_phone(self, phone: str) -> str:
        """
        Normalize phone number to E.164 format (+254XXXXXXXXX).
        Handles Kenyan numbers.
        """
        phone = phone.strip().replace(" ", "").replace("-", "")
        
        # Already in E.164 format
        if phone.startswith("+254"):
            return phone
        
        # Starts with country code without +
        if phone.startswith("254"):
            return "+" + phone
        
        # Starts with 0 (local format)
        if phone.startswith("0"):
            return "+254" + phone[1:]
        
        # Invalid format
        raise ValueError(f"Invalid phone number format: {phone}")

    def generate_otp(self) -> str:
        """
        Generate a cryptographically secure 6-digit OTP.
        Uses secrets module instead of random for security.
        """
        return str(secrets.randbelow(900000) + 100000)

    def check_rate_limit(self, phone: str) -> bool:
        """
        Check if phone number has exceeded OTP request rate limit.
        Allows 3 requests per 5 minutes.
        """
        if not self.redis:
            return True  # Allow if Redis is down
            
        key = f"otp_attempts:{phone}"
        attempts = self.redis.get(key)
        
        if attempts and int(attempts) >= 3:
            print(f"[AT] Rate limit exceeded for {phone}")
            return False
        
        return True

    def increment_rate_limit(self, phone: str):
        """
        Increment rate limit counter for phone number.
        """
        if not self.redis:
            return
            
        key = f"otp_attempts:{phone}"
        self.redis.incr(key)
        self.redis.expire(key, 300)  # 5 minutes

    def send_verification_code(self, phone: str) -> bool:
        """
        Generate, store and send a verification code via Premium SMS.
        """
        try:
            # Normalize phone number
            normalized_phone = self.normalize_phone(phone)
        except ValueError as e:
            print(f"[AT] Phone normalization error: {e}")
            return False
        
        # Check rate limit
        if not self.check_rate_limit(normalized_phone):
            return False
        
        # Generate secure OTP
        code = self.generate_otp()
        
        # Store in Redis with 5 minute expiry
        if self.redis:
            self.redis.set(f"otp:{normalized_phone}", code, ex=300)
            print(f"[AT] Stored OTP for {normalized_phone}")
        else:
            print(f"[AT] CRITICAL: Redis not available")
            if self.environment == "production":
                return False  # Fail in production if Redis is down
            code = "000000"  # Fallback for development
        
        # Increment rate limit
        self.increment_rate_limit(normalized_phone)
        
        # Development mode: skip SMS
        if not self.sms:
            print(f"[AT] Development mode. Phone: {normalized_phone}, Code: {code}")
            return True
            
        try:
            message = f"Your Suqafuran verification code is: {code}"
            
            print(f"[AT] Sending Premium SMS to {normalized_phone}")
            print(f"[AT] Username: {self.username}")
            print(f"[AT] Sender ID (from): {self.sender_id}")
            
            # For sandbox, don't use sender_id as it may cause auth issues
            if self.username == "sandbox":
                print(f"[AT] Sandbox mode - sending without sender ID")
                response = self.sms.send(message, [normalized_phone])
            else:
                # Premium SMS - use sender ID for production
                response = self.sms.send(
                    message,
                    [normalized_phone],
                    sender_id=self.sender_id
                )
            
            print(f"[AT] SMS Response: {response}")
            
            # Check response for success
            if response and 'SMSMessageData' in response:
                recipients = response['SMSMessageData'].get('Recipients', [])
                if recipients:
                    status_code = recipients[0].get('statusCode', 0)
                    if status_code in [100, 101, 102]:  # Processed, Sent, Queued
                        print(f"[AT] SMS sent successfully. Status: {status_code}")
                        return True
                    else:
                        print(f"[AT] SMS failed. Status code: {status_code}")
                        if self.environment == "production":
                            return False
            
            return True
            
        except Exception as e:
            print(f"\n[AT] SMS SENDING FAILED: {e}")
            print(f"[AT] Error type: {type(e).__name__}")
            
            # In production, fail hard
            if self.environment == "production":
                return False
            
            # In development, allow fallback with prominent logging
            print("\n" + "="*40)
            print(f"  DEVELOPMENT OTP FALLBACK")
            print(f"  Phone: {normalized_phone}")
            print(f"  Code:  {code}")
            print("="*40 + "\n")
            return True

    def check_verification_code(self, phone: str, code: str) -> bool:
        """
        Check if the provided code matches the one in Redis.
        """
        try:
            normalized_phone = self.normalize_phone(phone)
        except ValueError as e:
            print(f"[AT] Phone normalization error: {e}")
            return False
            
        if not self.redis:
            # Development fallback
            if self.environment == "development":
                return code == "000000"
            return False
            
        stored_code = self.redis.get(f"otp:{normalized_phone}")
        
        if stored_code and stored_code == code:
            # Delete code after successful verification
            self.redis.delete(f"otp:{normalized_phone}")
            print(f"[AT] OTP verified for {normalized_phone}")
            return True
        
        print(f"[AT] OTP verification failed for {normalized_phone}")
        return False

    def store_pending_signup(self, phone: str, signup_data: dict) -> bool:
        """
        Store pending signup data in Redis with 10-minute expiry.
        """
        try:
            normalized_phone = self.normalize_phone(phone)
        except ValueError as e:
            print(f"[AT] Phone normalization error: {e}")
            return False
            
        if not self.redis:
            print(f"[AT] Redis not available, cannot store pending signup")
            return False
            
        try:
            import json
            self.redis.set(f"signup:{normalized_phone}", json.dumps(signup_data), ex=600)
            print(f"[AT] Stored pending signup for {normalized_phone}")
            return True
        except Exception as e:
            print(f"[AT] Error storing pending signup: {e}")
            return False

    def get_pending_signup(self, phone: str) -> dict | None:
        """
        Retrieve pending signup data from Redis.
        """
        try:
            normalized_phone = self.normalize_phone(phone)
        except ValueError:
            return None
            
        if not self.redis:
            return None
            
        try:
            import json
            data = self.redis.get(f"signup:{normalized_phone}")
            if data:
                print(f"[AT] Retrieved pending signup for {normalized_phone}")
                return json.loads(data)
            return None
        except Exception as e:
            print(f"[AT] Error retrieving pending signup: {e}")
            return None

    def delete_pending_signup(self, phone: str) -> bool:
        """
        Delete pending signup data from Redis.
        """
        try:
            normalized_phone = self.normalize_phone(phone)
        except ValueError:
            return False
            
        if not self.redis:
            return False
            
        try:
            self.redis.delete(f"signup:{normalized_phone}")
            print(f"[AT] Deleted pending signup for {normalized_phone}")
            return True
        except Exception as e:
            print(f"[AT] Error deleting pending signup: {e}")
            return False

africastalking_service = AfricasTalkingService()
