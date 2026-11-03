package com.suqafuran.billing;

public enum PaymentStatus {
    PENDING,
    PROCESSING,
    SUCCESSFUL,
    FAILED,
    CANCELLED,
    REFUNDED,
    RECONCILIATION_REQUIRED;

    public boolean isTerminal() {
        return this == SUCCESSFUL || this == FAILED || this == CANCELLED || this == REFUNDED;
    }
}

