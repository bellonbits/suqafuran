package com.suqafuran.subscriptions;

public enum SubscriptionStatus {
    PENDING,
    ACTIVE,
    PAST_DUE,
    GRACE_PERIOD,
    CANCELED,
    EXPIRED;

    public boolean isValidForEntitlements() {
        return this == ACTIVE || this == GRACE_PERIOD;
    }
}

