package com.suqafuran.entitlements;

public record EntitlementLimits(
        int maxActiveListings,
        int currentActiveListings,
        boolean canCreateListing,
        int staffAccounts
) {}

