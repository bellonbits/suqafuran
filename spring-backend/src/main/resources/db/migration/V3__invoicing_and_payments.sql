-- =============================================================================
-- SUQAFURAN SPRING BOOT BUSINESS SCHEMA MIGRATION V3
-- Invoicing, M-Pesa STK Push Reference Tracking, and Proration History
-- =============================================================================

-- 1. Add M-Pesa tracking & invoice columns to billing_payment
ALTER TABLE billing_payment
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS merchant_request_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS plan_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) NOT NULL DEFAULT 'SUBSCRIPTION';

CREATE INDEX IF NOT EXISTS idx_billing_payment_checkout_req ON billing_payment(checkout_request_id);

-- 2. Formal Invoices Table
CREATE TABLE IF NOT EXISTS invoice (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    seller_id BIGINT NOT NULL,
    payment_id UUID REFERENCES billing_payment(id),
    plan_code VARCHAR(50),
    description VARCHAR(255) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    status VARCHAR(30) NOT NULL DEFAULT 'PAID',
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_seller ON invoice(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoice(invoice_number);

