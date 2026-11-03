package com.suqafuran.entitlements;

import com.suqafuran.subscriptions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class EntitlementServiceTest {

    private SellerSubscriptionRepository subscriptionRepository;
    private SubscriptionPlanRepository planRepository;
    private EntitlementService entitlementService;

    @BeforeEach
    void setUp() {
        subscriptionRepository = Mockito.mock(SellerSubscriptionRepository.class);
        planRepository = Mockito.mock(SubscriptionPlanRepository.class);
        entitlementService = new EntitlementService(subscriptionRepository, planRepository);
    }

    @Test
    void testFreeTierDefaultWhenNoSubscription() {
        when(subscriptionRepository.findBySellerId(100L)).thenReturn(Optional.empty());

        SubscriptionPlan freePlan = new SubscriptionPlan(
                "FREE", "Free Starter", java.math.BigDecimal.ZERO, "KES", 365, 10, "[\"BASIC_SUPPORT\"]"
        );
        when(planRepository.findByPlanCode("FREE")).thenReturn(Optional.of(freePlan));

        EntitlementResponse response = entitlementService.getSellerEntitlements(100L, 5);

        assertEquals(100L, response.sellerId());
        assertEquals("free", response.plan());
        assertEquals("active", response.status());
        assertEquals(10, response.limits().maxActiveListings());
        assertEquals(5, response.limits().currentActiveListings());
        assertTrue(response.limits().canCreateListing());
        assertEquals(1, response.limits().staffAccounts());
    }

    @Test
    void testFreeTierMaxListingsReached() {
        when(subscriptionRepository.findBySellerId(101L)).thenReturn(Optional.empty());

        SubscriptionPlan freePlan = new SubscriptionPlan(
                "FREE", "Free Starter", java.math.BigDecimal.ZERO, "KES", 365, 10, "[\"BASIC_SUPPORT\"]"
        );
        when(planRepository.findByPlanCode("FREE")).thenReturn(Optional.of(freePlan));

        EntitlementResponse response = entitlementService.getSellerEntitlements(101L, 10);

        assertFalse(response.limits().canCreateListing());
    }

    @Test
    void testActiveProSubscription() {
        SellerSubscription sub = new SellerSubscription(200L, "PRO", Instant.now().plus(15, ChronoUnit.DAYS));
        sub.setStatus(SubscriptionStatus.ACTIVE);
        when(subscriptionRepository.findBySellerId(200L)).thenReturn(Optional.of(sub));

        SubscriptionPlan proPlan = new SubscriptionPlan(
                "PRO", "Pro Seller", java.math.BigDecimal.valueOf(1999), "KES", 30, 50, "[\"VERIFIED_BADGE\", \"ANALYTICS\"]"
        );
        when(planRepository.findByPlanCode("PRO")).thenReturn(Optional.of(proPlan));

        EntitlementResponse response = entitlementService.getSellerEntitlements(200L, 12);

        assertEquals("pro", response.plan());
        assertEquals("active", response.status());
        assertEquals(50, response.limits().maxActiveListings());
        assertEquals(12, response.limits().currentActiveListings());
        assertTrue(response.limits().canCreateListing());
        assertEquals(2, response.limits().staffAccounts());
        assertTrue(response.features().contains("VERIFIED_BADGE"));
    }

    @Test
    void testExpiredSubscriptionFallsBackToFreeLimits() {
        SellerSubscription sub = new SellerSubscription(300L, "PRO", Instant.now().minus(2, ChronoUnit.DAYS));
        sub.setStatus(SubscriptionStatus.EXPIRED);
        when(subscriptionRepository.findBySellerId(300L)).thenReturn(Optional.of(sub));

        SubscriptionPlan freePlan = new SubscriptionPlan(
                "FREE", "Free Starter", java.math.BigDecimal.ZERO, "KES", 365, 10, "[\"BASIC_SUPPORT\"]"
        );
        when(planRepository.findByPlanCode("FREE")).thenReturn(Optional.of(freePlan));

        EntitlementResponse response = entitlementService.getSellerEntitlements(300L, 10);

        assertEquals("free", response.plan());
        assertEquals("expired", response.status());
        assertEquals(10, response.limits().maxActiveListings());
        assertFalse(response.limits().canCreateListing());
    }
}
