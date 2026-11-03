package com.suqafuran.subscriptions;

import com.suqafuran.billing.BillingService;
import com.suqafuran.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionPlanRepository planRepository;
    private final SellerSubscriptionRepository subscriptionRepository;
    private final BillingService billingService;

    public SubscriptionController(
            SubscriptionPlanRepository planRepository,
            SellerSubscriptionRepository subscriptionRepository,
            BillingService billingService
    ) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.billingService = billingService;
    }

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getActivePlans() {
        return ResponseEntity.ok(planRepository.findAll());
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentSubscription(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return subscriptionRepository.findBySellerId(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(null));
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            billingService.cancelSubscription(user.getId());
            return ResponseEntity.ok(Map.of("success", true, "message", "Auto-renewal cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

