package com.suqafuran.entitlements;

import com.suqafuran.subscriptions.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class EntitlementService {

    private final SellerSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;

    public EntitlementService(SellerSubscriptionRepository subscriptionRepository,
                              SubscriptionPlanRepository planRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
    }

    public EntitlementResponse getSellerEntitlements(Long sellerId, int currentActiveListings) {
        Optional<SellerSubscription> subOpt = subscriptionRepository.findBySellerId(sellerId);

        String effectivePlanCode = "FREE";
        String status = "ACTIVE";
        Instant expiresAt = null;

        if (subOpt.isPresent()) {
            SellerSubscription sub = subOpt.get();
            expiresAt = sub.getExpiresAt();

            if (sub.getStatus().isValidForEntitlements() &&
                    (expiresAt == null || expiresAt.isAfter(Instant.now()))) {
                effectivePlanCode = sub.getPlanCode();
                status = sub.getStatus().name();
            } else {
                status = "EXPIRED";
            }
        }

        // Retrieve plan details
        Optional<SubscriptionPlan> planOpt = planRepository.findByPlanCode(effectivePlanCode);
        int maxListings = 10;
        int staffAccounts = 1;
        List<String> features = new ArrayList<>();

        if (planOpt.isPresent()) {
            SubscriptionPlan plan = planOpt.get();
            maxListings = plan.getMaxActiveListings();
            features = parseFeatures(plan.getFeatures());

            if ("BUSINESS".equalsIgnoreCase(effectivePlanCode)) {
                staffAccounts = 5;
            } else if ("PRO".equalsIgnoreCase(effectivePlanCode)) {
                staffAccounts = 2;
            }
        } else {
            features.add("BASIC_SUPPORT");
        }

        boolean canCreateListing = currentActiveListings < maxListings;

        EntitlementLimits limits = new EntitlementLimits(
                maxListings,
                currentActiveListings,
                canCreateListing,
                staffAccounts
        );

        return new EntitlementResponse(
                sellerId,
                effectivePlanCode.toLowerCase(),
                status.toLowerCase(),
                expiresAt,
                limits,
                features
        );
    }

    private List<String> parseFeatures(String rawJson) {
        List<String> list = new ArrayList<>();
        if (rawJson == null || rawJson.isBlank()) {
            return list;
        }
        // Simple JSON array parser without heavy dependencies
        String clean = rawJson.replace("[", "").replace("]", "").replace("\"", "").trim();
        if (clean.isBlank()) {
            return list;
        }
        for (String item : clean.split(",")) {
            String trimmed = item.trim();
            if (!trimmed.isEmpty()) {
                list.add(trimmed);
            }
        }
        return list;
    }
}

