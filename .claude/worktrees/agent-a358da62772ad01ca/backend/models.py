from sqlalchemy import Column, String, Integer, Float, DateTime, Enum, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAYMENT_PENDING = "payment_pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    IN_DELIVERY = "in_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class DeliveryOption(str, enum.Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"

class IssueType(str, enum.Enum):
    ITEM_MISMATCH = "item_mismatch"
    DAMAGED = "damaged"
    MISSING_ITEMS = "missing_items"
    OTHER = "other"

class IssueStatus(str, enum.Enum):
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class SellerVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = relationship("Order", back_populates="user")

# Seller Model
class Seller(Base):
    __tablename__ = "sellers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    shop_name = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    mpesa_number = Column(String, unique=True, nullable=False)
    mpesa_verified = Column(Boolean, default=False)
    shop_address = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    verification_status = Column(String, default=SellerVerificationStatus.PENDING)
    is_active = Column(Boolean, default=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = relationship("Order", back_populates="seller")
    withdrawals = relationship("Withdrawal", back_populates="seller")

# Order Model
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    seller_id = Column(String, ForeignKey("sellers.id"), nullable=False)
    status = Column(String, default=OrderStatus.PENDING)
    delivery_option = Column(String, default=DeliveryOption.DELIVERY)
    delivery_address = Column(Text)
    phone_number = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    seller_amount = Column(Float, nullable=False)
    courier_tip = Column(Float, default=0)
    payment_status = Column(String, default=PaymentStatus.PENDING)
    payment_reference = Column(String)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="orders")
    seller = relationship("Seller", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    issue = relationship("Issue", back_populates="order", uselist=False)

# Order Item Model
class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")

# Payment Model
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False, unique=True)
    amount = Column(Float, nullable=False)
    status = Column(String, default=PaymentStatus.PENDING)
    mpesa_reference = Column(String)
    merchant_request_id = Column(String)
    checkout_request_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("Order", back_populates="payment")

# Issue Model
class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False, unique=True)
    issue_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default=IssueStatus.UNDER_REVIEW)
    resolution_type = Column(String)  # refund or replacement
    admin_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("Order", back_populates="issue")

# Withdrawal Model
class Withdrawal(Base):
    __tablename__ = "withdrawals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("sellers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default=PaymentStatus.PENDING)
    mpesa_reference = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    seller = relationship("Seller", back_populates="withdrawals")

# Rider Model
# Rider Status Enums
class RiderAvailabilityStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ON_DELIVERY = "on_delivery"

class WithdrawalMethod(str, enum.Enum):
    MPESA = "mpesa"
    BANK = "bank"

class WithdrawalStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    REJECTED = "rejected"

class RiderDeliveryStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

# Rider Model
class Rider(Base):
    __tablename__ = "riders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    phone = Column(String, nullable=False)
    vehicle_type = Column(String)  # motorcycle, car, bicycle
    vehicle_plate = Column(String)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    current_lat = Column(Float)
    current_lng = Column(Float)

    # Banking information
    bank_account = Column(String)  # masked
    bank_name = Column(String)
    mpesa_number = Column(String)
    mpesa_verified = Column(Boolean, default=False)

    # Rider performance metrics
    availability_status = Column(String, default=RiderAvailabilityStatus.OFFLINE)
    total_deliveries = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)
    response_time_avg = Column(Integer, default=0)  # minutes
    document_expiry = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    earnings = relationship("RiderEarnings", back_populates="rider", cascade="all, delete-orphan")
    withdrawals = relationship("RiderWithdrawal", back_populates="rider", cascade="all, delete-orphan")

# Delivery Assignment Model
class DeliveryAssignment(Base):
    __tablename__ = "delivery_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)
    status = Column(String, default=RiderDeliveryStatus.ASSIGNED)

    # Delivery milestones
    pickup_confirmed_at = Column(DateTime)
    delivery_completed_at = Column(DateTime)
    proof_of_delivery_url = Column(String)

    # Earnings tracking
    estimated_earnings = Column(Float)
    final_earnings = Column(Float)

    # Ratings
    customer_rating = Column(Integer)  # 1-5 for rider rating from customer
    rider_rating_of_customer = Column(Integer)  # 1-5 for customer rating from rider

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Rider Earnings Model
class RiderEarnings(Base):
    __tablename__ = "rider_earnings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)
    delivery_id = Column(String, ForeignKey("delivery_assignments.id"), nullable=False)

    # Earning breakdown
    base_fee = Column(Float, nullable=False)
    distance_bonus = Column(Float, default=0.0)
    speed_bonus = Column(Float, default=0.0)
    rating_bonus = Column(Float, default=0.0)
    total_earned = Column(Float, nullable=False)

    # Metadata
    date = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rider = relationship("Rider", back_populates="earnings")

# Rider Withdrawal Model
class RiderWithdrawal(Base):
    __tablename__ = "rider_withdrawals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)

    # Withdrawal details
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False)  # mpesa, bank
    status = Column(String, default=WithdrawalStatus.PENDING)  # pending, completed, rejected

    # Transaction tracking
    requested_date = Column(DateTime, default=datetime.utcnow, index=True)
    completed_date = Column(DateTime)
    transaction_id = Column(String)  # M-Pesa or bank transaction ID

    # Additional info
    reason_rejected = Column(String)  # If rejected, why

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rider = relationship("Rider", back_populates="withdrawals")

# Notification Enums
class NotificationType(str, enum.Enum):
    ORDER = "order"
    PAYMENT = "payment"
    DELIVERY = "delivery"
    ISSUE = "issue"
    PROMOTION = "promotion"
    SYSTEM = "system"

class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class NotificationChannel(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in-app"

# Notification Model
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # order, payment, delivery, issue, promotion, system
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default=NotificationStatus.UNREAD)  # unread, read, archived
    action_url = Column(String)
    action_label = Column(String)
    data = Column(JSON)  # Extra metadata (orderId, etc.)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

# Notification Preferences Model
class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    in_app_notifications = Column(Boolean, default=True)
    order_updates = Column(Boolean, default=True)
    payment_updates = Column(Boolean, default=True)
    delivery_updates = Column(Boolean, default=True)
    promotions = Column(Boolean, default=True)
    system_alerts = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

# Notification Log Model (for tracking delivery attempts)
class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = Column(String, ForeignKey("notifications.id"), nullable=False)
    channel = Column(String, nullable=False)  # email, sms, push
    status = Column(String, nullable=False)  # pending, sent, failed, bounced
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Device Token Model (for push notifications)
class DeviceToken(Base):
    __tablename__ = "device_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    device_type = Column(String)  # ios, android, web
    device_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

# Real-time Event Log Model
class RealtimeEvent(Base):
    __tablename__ = "realtime_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # order_update, delivery_update, notification, connection, etc.
    event_data = Column(JSON, nullable=False)
    order_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    processed = Column(Boolean, default=False)

    user = relationship("User")
