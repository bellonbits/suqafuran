-- =============================================================================
-- SUQAFURAN SPRING BOOT BUSINESS SCHEMA MIGRATION V2
-- Messaging Enhancements: Read Receipts, Unread Counters, Archiving, Blocking & Reports
-- =============================================================================

-- 1. Conversation Counters & Settings
ALTER TABLE conversation
    ADD COLUMN IF NOT EXISTS buyer_unread_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seller_unread_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_archived_by_buyer BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_archived_by_seller BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_muted_by_buyer BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_muted_by_seller BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Message Read Receipts
ALTER TABLE chat_message
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 3. Blocked Users (Safety & Anti-Harassment)
CREATE TABLE IF NOT EXISTS blocked_user (
    id UUID PRIMARY KEY,
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_blocker_blocked UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_user_blocker ON blocked_user(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_user_blocked ON blocked_user(blocked_id);

-- 4. Message Abuse Reporting
CREATE TABLE IF NOT EXISTS message_report (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_message(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_report_status ON message_report(status);

