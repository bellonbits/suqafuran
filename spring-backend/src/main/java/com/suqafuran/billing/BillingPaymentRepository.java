package com.suqafuran.billing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingPaymentRepository extends JpaRepository<BillingPayment, UUID> {
    Optional<BillingPayment> findByIdempotencyKeyAndSellerId(String idempotencyKey, Long sellerId);
    Optional<BillingPayment> findByProviderTransactionId(String providerTransactionId);
    Optional<BillingPayment> findByCheckoutRequestId(String checkoutRequestId);
    Optional<BillingPayment> findByInvoiceNumber(String invoiceNumber);
    Page<BillingPayment> findBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);
}

