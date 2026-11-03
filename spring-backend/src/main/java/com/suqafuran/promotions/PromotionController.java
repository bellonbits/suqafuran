package com.suqafuran.promotions;

import com.suqafuran.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    public record ActivatePromotionRequest(
            Long listingId,
            String packageCode,
            UUID paymentId
    ) {}

    public record BoostLevelsRequest(List<Long> listingIds) {}

    @GetMapping("/api/v1/promotions/packages")
    public ResponseEntity<List<PromotionPackage>> getPackages() {
        return ResponseEntity.ok(promotionService.getActivePackages());
    }

    @PostMapping("/api/v1/promotions/activate")
    public ResponseEntity<?> activatePromotion(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody ActivatePromotionRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (request.listingId() == null || request.packageCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "listingId and packageCode are required"));
        }

        try {
            PromotedListing promo = promotionService.activatePromotion(
                    user.getId(),
                    request.listingId(),
                    request.packageCode(),
                    request.paymentId()
            );
            return ResponseEntity.ok(promo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/v1/promotions/my-promotions")
    public ResponseEntity<?> getMyPromotions(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(promotionService.getSellerPromotions(user.getId()));
    }

    @GetMapping("/api/v1/promotions/featured")
    public ResponseEntity<List<PromotedListing>> getFeaturedListings() {
        return ResponseEntity.ok(promotionService.getActiveFeaturedListings());
    }

    @PostMapping("/api/v1/promotions/{id}/impression")
    public ResponseEntity<?> recordImpression(@PathVariable UUID id) {
        promotionService.recordImpression(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/api/v1/promotions/{id}/click")
    public ResponseEntity<?> recordClick(@PathVariable UUID id) {
        promotionService.recordClick(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/internal/v1/promotions/boost-levels")
    public ResponseEntity<Map<Long, Integer>> getBoostLevels(@RequestBody BoostLevelsRequest request) {
        Map<Long, Integer> boosts = promotionService.getActiveBoostLevels(request.listingIds());
        return ResponseEntity.ok(boosts);
    }
}

