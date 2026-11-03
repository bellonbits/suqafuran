package com.suqafuran.entitlements;

import java.time.Instant;
import java.util.List;

public record EntitlementResponse(
        Long sellerId,
        String plan,
        String status,
        Instant expiresAt,
        EntitlementLimits limits,
        List<String> features
) {}

