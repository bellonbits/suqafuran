package com.suqafuran.billing;

import com.suqafuran.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    public record StkPushRequest(
            String planCode,
            String phoneNumber,
            String idempotencyKey
    ) {}

    @PostMapping("/api/v1/billing/mpesa/stk-push")
    public ResponseEntity<?> initiateMpesaStkPush(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody StkPushRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (request.planCode() == null || request.planCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan code is required"));
        }

        if (request.phoneNumber() == null || request.phoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number is required"));
        }

        String idemKey = request.idempotencyKey() != null ? request.idempotencyKey() : UUID.randomUUID().toString();

        try {
            BillingPayment payment = billingService.initiateMpesaPayment(
                    user.getId(),
                    request.planCode(),
                    request.phoneNumber(),
                    idemKey
            );
            return ResponseEntity.ok(payment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/v1/billing/webhook/mpesa")
    public ResponseEntity<?> handleMpesaCallback(@RequestBody Map<String, Object> payload) {
        try {
            BillingPayment updated = billingService.handleMpesaCallback(payload);
            return ResponseEntity.ok(Map.of(
                    "ResultCode", 0,
                    "ResultDesc", "Accepted",
                    "paymentId", updated.getId(),
                    "status", updated.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "ResultCode", 1,
                    "ResultDesc", e.getMessage()
            ));
        }
    }

    @GetMapping("/api/v1/billing/proration-quote")
    public ResponseEntity<?> getProrationQuote(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam String targetPlanCode
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            BillingService.ProrationQuote quote = billingService.calculateProration(user.getId(), targetPlanCode);
            return ResponseEntity.ok(quote);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/v1/billing/invoices")
    public ResponseEntity<?> getInvoices(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Page<Invoice> invoices = billingService.getSellerInvoices(user.getId(), page, size);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/api/v1/billing/invoices/{id}")
    public ResponseEntity<?> getInvoice(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return billingService.getInvoice(id)
                .filter(inv -> inv.getSellerId().equals(user.getId()) || "admin".equalsIgnoreCase(user.getRole()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/v1/billing/payments/{id}")
    public ResponseEntity<?> getPayment(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        return billingService.getPayment(id)
                .filter(p -> p.getSellerId().equals(user.getId()) || "admin".equalsIgnoreCase(user.getRole()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/v1/billing/payments/history")
    public ResponseEntity<?> getHistory(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Page<BillingPayment> payments = billingService.getSellerPayments(user.getId(), page, size);
        return ResponseEntity.ok(payments);
    }
}
