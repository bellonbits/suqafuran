package com.suqafuran.entitlements;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
public class EntitlementController {

    private final EntitlementService entitlementService;

    public EntitlementController(EntitlementService entitlementService) {
        this.entitlementService = entitlementService;
    }

    @GetMapping("/api/v1/entitlements/{sellerId}")
    public ResponseEntity<EntitlementResponse> getEntitlements(
            @PathVariable Long sellerId,
            @RequestParam(defaultValue = "0") int currentActiveListings) {
        EntitlementResponse response = entitlementService.getSellerEntitlements(sellerId, currentActiveListings);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/internal/v1/entitlements/sellers/{sellerId}")
    public ResponseEntity<EntitlementResponse> getInternalEntitlements(
            @PathVariable Long sellerId,
            @RequestParam(defaultValue = "0") int currentActiveListings) {
        EntitlementResponse response = entitlementService.getSellerEntitlements(sellerId, currentActiveListings);
        return ResponseEntity.ok(response);
    }
}

