package com.suqafuran.promotions;

import com.suqafuran.audit.AuditService;
import com.suqafuran.billing.BillingPayment;
import com.suqafuran.billing.BillingPaymentRepository;
import com.suqafuran.billing.MpesaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class PromotionService {

    private static final Logger logger = LoggerFactory.getLogger(PromotionService.class);

    public static final String REDIS_ACTIVE_LISTINGS_KEY = "suqafuran:promotions:active_listing_ids";
    public static final String REDIS_IMPRESSIONS_KEY = "suqafuran:promotions:impressions";
    public static final String REDIS_CLICKS_KEY = "suqafuran:promotions:clicks";

    private final PromotedListingRepository promotedListingRepository;
    private final PromotionPackageRepository packageRepository;
    private final BillingPaymentRepository paymentRepository;
    private final AuditService auditService;
    private final MpesaClient mpesaClient;
    private final StringRedisTemplate redisTemplate;

    public PromotionService(
            PromotedListingRepository promotedListingRepository,
            PromotionPackageRepository packageRepository,
            BillingPaymentRepository paymentRepository,
            AuditService auditService,
            @Autowired(required = false) MpesaClient mpesaClient,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.promotedListingRepository = promotedListingRepository;
        this.packageRepository = packageRepository;
        this.paymentRepository = paymentRepository;
        this.auditService = auditService;
        this.mpesaClient = mpesaClient != null ? mpesaClient : new MpesaClient(new com.suqafuran.billing.MpesaProperties());
        this.redisTemplate = redisTemplate;
    }

    public List<PromotionPackage> getActivePackages() {
        return packageRepository.findByIsActiveTrueOrderByPriceAsc();
    }

    @Transactional
    public PromotedListing activatePromotion(
            Long sellerId,
            Long listingId,
            String packageCode,
            UUID paymentId
    ) {
        PromotionPackage pkg = packageRepository.findById(packageCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid promotion package: " + packageCode));

        Instant now = Instant.now();
        Instant endsAt = now.plus(pkg.getDurationDays(), ChronoUnit.DAYS);

        PromotedListing promo = new PromotedListing();
        promo.setListingId(listingId);
        promo.setSellerId(sellerId);
        promo.setPackageCode(pkg.getPackageCode());
        promo.setPlacementType(pkg.getPlacementType());
        promo.setBoostLevel(pkg.getBoostLevel());
        promo.setStartsAt(now);
        promo.setEndsAt(endsAt);
        promo.setIsActive(true);
        promo.setPaymentId(paymentId);
        promo.setAmountPaid(pkg.getPrice());

        PromotedListing saved = promotedListingRepository.save(promo);

        // Update Redis cache for real-time search engine query boosting
        updateRedisCache(saved);

        auditService.log(
                sellerId,
                "PROMOTION_ACTIVATED",
                "PROMOTED_LISTING",
                saved.getId().toString(),
                "Package " + packageCode + " (Level " + pkg.getBoostLevel() + ") on listing " + listingId + " until " + endsAt,
                null
        );

        return saved;
    }

    public void recordImpression(UUID promotionId) {
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForHash().increment(REDIS_IMPRESSIONS_KEY, promotionId.toString(), 1);
            } catch (Exception e) {
                logger.debug("Redis impression increment failed: {}", e.getMessage());
            }
        }
    }

    public void recordClick(UUID promotionId) {
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForHash().increment(REDIS_CLICKS_KEY, promotionId.toString(), 1);
            } catch (Exception e) {
                logger.debug("Redis click increment failed: {}", e.getMessage());
            }
        }
    }

    public Map<Long, Integer> getActiveBoostLevels(List<Long> listingIds) {
        Map<Long, Integer> result = new HashMap<>();
        if (listingIds == null || listingIds.isEmpty()) {
            return result;
        }

        Instant now = Instant.now();
        for (Long id : listingIds) {
            promotedListingRepository.findFirstByListingIdAndIsActiveTrueAndEndsAtAfterOrderByBoostLevelDesc(id, now)
                    .ifPresent(promo -> result.put(id, promo.getBoostLevel()));
        }
        return result;
    }

    public List<PromotedListing> getSellerPromotions(Long sellerId) {
        List<PromotedListing> list = promotedListingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        if (redisTemplate != null) {
            for (PromotedListing p : list) {
                try {
                    Object imp = redisTemplate.opsForHash().get(REDIS_IMPRESSIONS_KEY, p.getId().toString());
                    if (imp != null) {
                        p.setImpressionsCount(p.getImpressionsCount() + Long.parseLong(imp.toString()));
                    }
                    Object clk = redisTemplate.opsForHash().get(REDIS_CLICKS_KEY, p.getId().toString());
                    if (clk != null) {
                        p.setClicksCount(p.getClicksCount() + Long.parseLong(clk.toString()));
                    }
                } catch (Exception ignored) {}
            }
        }
        return list;
    }

    public List<PromotedListing> getActiveFeaturedListings() {
        return promotedListingRepository.findByIsActiveTrueAndEndsAtAfterOrderByStartsAtDesc(Instant.now());
    }

    private void updateRedisCache(PromotedListing promo) {
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForSet().add(REDIS_ACTIVE_LISTINGS_KEY, promo.getListingId().toString());
                redisTemplate.opsForValue().set(
                        "suqafuran:promotions:boost_level:" + promo.getListingId(),
                        promo.getBoostLevel().toString()
                );
            } catch (Exception e) {
                logger.debug("Redis promotion cache update failed: {}", e.getMessage());
            }
        }
    }
}

