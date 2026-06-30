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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Delivery Assignment Model
class DeliveryAssignment(Base):
    __tablename__ = "delivery_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)
    status = Column(String, default="assigned")  # assigned, picked_up, delivered
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
