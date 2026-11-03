package com.suqafuran.promotions;

import com.suqafuran.audit.AuditService;
import com.suqafuran.billing.BillingPaymentRepository;
import com.suqafuran.billing.MpesaClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PromotionServiceTest {

    private PromotedListingRepository promotedListingRepository;
    private PromotionPackageRepository packageRepository;
    private BillingPaymentRepository paymentRepository;
    private AuditService auditService;
    private MpesaClient mpesaClient;
    private StringRedisTemplate redisTemplate;
    private PromotionService promotionService;

    @BeforeEach
    void setUp() {
        promotedListingRepository = Mockito.mock(PromotedListingRepository.class);
        packageRepository = Mockito.mock(PromotionPackageRepository.class);
        paymentRepository = Mockito.mock(BillingPaymentRepository.class);
        auditService = Mockito.mock(AuditService.class);
        mpesaClient = Mockito.mock(MpesaClient.class);
        redisTemplate = Mockito.mock(StringRedisTemplate.class);

        promotionService = new PromotionService(
                promotedListingRepository,
                packageRepository,
                paymentRepository,
                auditService,
                mpesaClient,
                redisTemplate
        );
    }

    @Test
    void testActivatePromotionSuccess() {
        PromotionPackage pkg = new PromotionPackage(
                "VIP_7_DAYS", "7-Day VIP", "VIP_BADGE", 2, 7, BigDecimal.valueOf(999), "KES", "VIP badge"
        );
        when(packageRepository.findById("VIP_7_DAYS")).thenReturn(Optional.of(pkg));
        when(promotedListingRepository.save(any(PromotedListing.class))).thenAnswer(i -> i.getArgument(0));

        SetOperations setOps = Mockito.mock(SetOperations.class);
        ValueOperations valOps = Mockito.mock(ValueOperations.class);
        when(redisTemplate.opsForSet()).thenReturn(setOps);
        when(redisTemplate.opsForValue()).thenReturn(valOps);

        UUID paymentId = UUID.randomUUID();
        PromotedListing promo = promotionService.activatePromotion(80L, 1001L, "VIP_7_DAYS", paymentId);

        assertNotNull(promo);
        assertEquals(1001L, promo.getListingId());
        assertEquals(80L, promo.getSellerId());
        assertEquals("VIP_BADGE", promo.getPlacementType());
        assertEquals(2, promo.getBoostLevel());
        assertEquals(BigDecimal.valueOf(999), promo.getAmountPaid());
        assertTrue(promo.getEndsAt().isAfter(Instant.now().plus(6, ChronoUnit.DAYS)));

        verify(promotedListingRepository).save(any(PromotedListing.class));
        verify(setOps).add(eq(PromotionService.REDIS_ACTIVE_LISTINGS_KEY), eq("1001"));
        verify(auditService).log(eq(80L), eq("PROMOTION_ACTIVATED"), any(), any(), any(), any());
    }

    @Test
    void testActivatePromotionThrowsOnInvalidPackage() {
        when(packageRepository.findById("UNKNOWN_PACKAGE")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                promotionService.activatePromotion(80L, 1001L, "UNKNOWN_PACKAGE", UUID.randomUUID())
        );
    }

    @Test
    void testRecordImpressionAndClick() {
        HashOperations hashOps = Mockito.mock(HashOperations.class);
        when(redisTemplate.opsForHash()).thenReturn(hashOps);

        UUID promoId = UUID.randomUUID();
        promotionService.recordImpression(promoId);
        verify(hashOps).increment(eq(PromotionService.REDIS_IMPRESSIONS_KEY), eq(promoId.toString()), eq(1L));

        promotionService.recordClick(promoId);
        verify(hashOps).increment(eq(PromotionService.REDIS_CLICKS_KEY), eq(promoId.toString()), eq(1L));
    }

    @Test
    void testGetActiveBoostLevels() {
        PromotedListing p1 = new PromotedListing();
        p1.setListingId(201L);
        p1.setBoostLevel(3);

        when(promotedListingRepository.findFirstByListingIdAndIsActiveTrueAndEndsAtAfterOrderByBoostLevelDesc(eq(201L), any()))
                .thenReturn(Optional.of(p1));
        when(promotedListingRepository.findFirstByListingIdAndIsActiveTrueAndEndsAtAfterOrderByBoostLevelDesc(eq(202L), any()))
                .thenReturn(Optional.empty());

        Map<Long, Integer> boosts = promotionService.getActiveBoostLevels(List.of(201L, 202L));

        assertEquals(1, boosts.size());
        assertEquals(3, boosts.get(201L));
        assertNull(boosts.get(202L));
    }
}

