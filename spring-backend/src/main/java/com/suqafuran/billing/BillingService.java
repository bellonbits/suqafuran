package com.suqafuran.billing;

import com.suqafuran.audit.AuditService;
import com.suqafuran.subscriptions.SellerSubscription;
import com.suqafuran.subscriptions.SellerSubscriptionRepository;
import com.suqafuran.subscriptions.SubscriptionPlan;
import com.suqafuran.subscriptions.SubscriptionPlanRepository;
import com.suqafuran.subscriptions.SubscriptionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class BillingService {

    private static final Logger logger = LoggerFactory.getLogger(BillingService.class);
    private static final DateTimeFormatter INVOICE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");

    private final BillingPaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final SellerSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final AuditService auditService;
    private final MpesaClient mpesaClient;

    public BillingService(
            BillingPaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            SellerSubscriptionRepository subscriptionRepository,
            SubscriptionPlanRepository planRepository,
            AuditService auditService,
            @Autowired(required = false) MpesaClient mpesaClient
    ) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.auditService = auditService;
        this.mpesaClient = mpesaClient != null ? mpesaClient : new MpesaClient(new MpesaProperties());
    }

    public record ProrationQuote(
            String currentPlan,
            String targetPlan,
            BigDecimal currentPlanRemainingCredit,
            BigDecimal targetPlanPrice,
            BigDecimal netAmountToPay,
            long daysRemaining
    ) {}

    @Transactional
    public BillingPayment initiateMpesaPayment(
            Long sellerId,
            String planCode,
            String phoneNumber,
            String idempotencyKey
    ) {
        // 1. Idempotency check
        Optional<BillingPayment> existing = paymentRepository.findByIdempotencyKeyAndSellerId(idempotencyKey, sellerId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // 2. Determine price (with proration if upgrading)
        ProrationQuote quote = calculateProration(sellerId, planCode);
        BigDecimal amountToCharge = quote.netAmountToPay();

        // 3. Normalize phone number
        String normalizedPhone = mpesaClient.normalizePhoneNumber(phoneNumber);

        // 4. Create and persist Pending BillingPayment
        BillingPayment payment = new BillingPayment(
                sellerId,
                amountToCharge,
                "KES",
                idempotencyKey,
                normalizedPhone,
                "Subscription: " + planCode
        );
        payment.setPlanCode(planCode);
        payment.setPaymentType("SUBSCRIPTION");
        BillingPayment saved = paymentRepository.save(payment);

        // 5. Trigger Daraja STK Push
        MpesaClient.StkPushResult stkResult = mpesaClient.initiateStkPush(
                normalizedPhone,
                amountToCharge,
                "SQF-" + planCode,
                "Suqafuran " + planCode + " Plan"
        );

        saved.setMerchantRequestId(stkResult.merchantRequestId());
        saved.setCheckoutRequestId(stkResult.checkoutRequestId());
        paymentRepository.save(saved);

        auditService.log(
                sellerId,
                "MPESA_STK_PUSH_INITIATED",
                "BILLING_PAYMENT",
                saved.getId().toString(),
                "CheckoutRequestId: " + stkResult.checkoutRequestId() + " for " + amountToCharge + " KES",
                null
        );

        return saved;
    }

    @Transactional
    public BillingPayment handleMpesaCallback(Map<String, Object> callbackPayload) {
        if (callbackPayload == null || !callbackPayload.containsKey("Body")) {
            throw new IllegalArgumentException("Invalid M-Pesa callback payload format");
        }

        Map<?, ?> body = (Map<?, ?>) callbackPayload.get("Body");
        Map<?, ?> stkCallback = (Map<?, ?>) body.get("stkCallback");
        if (stkCallback == null) {
            throw new IllegalArgumentException("Missing stkCallback in payload");
        }

        String checkoutRequestId = (String) stkCallback.get("CheckoutRequestID");
        Number resultCodeNum = (Number) stkCallback.get("ResultCode");
        int resultCode = resultCodeNum != null ? resultCodeNum.intValue() : -1;
        String resultDesc = (String) stkCallback.get("ResultDesc");

        BillingPayment payment = paymentRepository.findByCheckoutRequestId(checkoutRequestId)
                .orElseThrow(() -> new IllegalArgumentException("No pending payment found for CheckoutRequestID: " + checkoutRequestId));

        if (payment.getStatus() == PaymentStatus.SUCCESSFUL) {
            return payment; // Already processed idempotently
        }

        if (resultCode == 0) { // Success
            String mpesaReceiptNumber = null;

            Map<?, ?> metadata = (Map<?, ?>) stkCallback.get("CallbackMetadata");
            if (metadata != null && metadata.containsKey("Item")) {
                List<?> items = (List<?>) metadata.get("Item");
                for (Object itemObj : items) {
                    if (itemObj instanceof Map<?, ?> itemMap) {
                        String name = (String) itemMap.get("Name");
                        if ("MpesaReceiptNumber".equals(name)) {
                            mpesaReceiptNumber = String.valueOf(itemMap.get("Value"));
                        }
                    }
                }
            }

            if (mpesaReceiptNumber == null) {
                mpesaReceiptNumber = "MPESA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            }

            return completeSuccessfulPayment(payment, mpesaReceiptNumber);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setErrorMessage(resultDesc);
            BillingPayment saved = paymentRepository.save(payment);

            auditService.log(
                    payment.getSellerId(),
                    "PAYMENT_FAILED",
                    "BILLING_PAYMENT",
                    payment.getId().toString(),
                    "Reason: " + resultDesc,
                    null
            );
            return saved;
        }
    }

    @Transactional
    public BillingPayment completeSuccessfulPayment(BillingPayment payment, String providerTransactionId) {
        payment.setStatus(PaymentStatus.SUCCESSFUL);
        payment.setProviderTransactionId(providerTransactionId);
        payment.setPaidAt(Instant.now());

        // 1. Generate Invoice
        Invoice invoice = issueInvoice(payment);
        payment.setInvoiceNumber(invoice.getInvoiceNumber());

        // 2. Activate or Extend Subscription
        String planCode = payment.getPlanCode();
        if (planCode != null && !planCode.isBlank()) {
            SubscriptionPlan plan = planRepository.findByPlanCode(planCode)
                    .orElse(null);
            int durationDays = (plan != null) ? plan.getDurationDays() : 30;

            SellerSubscription sub = subscriptionRepository.findBySellerId(payment.getSellerId())
                    .orElseGet(() -> new SellerSubscription(payment.getSellerId(), planCode, Instant.now()));

            sub.setPlanCode(planCode);
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setLastPaymentId(payment.getId());

            Instant baseTime = (sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(Instant.now()))
                    ? sub.getExpiresAt()
                    : Instant.now();
            sub.setExpiresAt(baseTime.plus(durationDays, ChronoUnit.DAYS));

            subscriptionRepository.save(sub);

            auditService.log(
                    payment.getSellerId(),
                    "SUBSCRIPTION_ACTIVATED",
                    "SELLER_SUBSCRIPTION",
                    sub.getId().toString(),
                    "Plan " + planCode + " active until " + sub.getExpiresAt(),
                    null
            );
        }

        BillingPayment saved = paymentRepository.save(payment);
        auditService.log(
                payment.getSellerId(),
                "PAYMENT_COMPLETED",
                "BILLING_PAYMENT",
                saved.getId().toString(),
                "Transaction Ref: " + providerTransactionId + "; Invoice: " + invoice.getInvoiceNumber(),
                null
        );

        return saved;
    }

    @Transactional
    public Invoice issueInvoice(BillingPayment payment) {
        String invoiceNumber = generateInvoiceNumber();

        BigDecimal total = payment.getAmount();
        BigDecimal subtotal = total; // Tax inclusive / standard pricing
        BigDecimal tax = BigDecimal.ZERO;

        Invoice invoice = new Invoice(
                invoiceNumber,
                payment.getSellerId(),
                payment.getId(),
                payment.getPlanCode(),
                payment.getDescription() != null ? payment.getDescription() : "Subscription Payment",
                subtotal,
                tax,
                total,
                payment.getCurrency()
        );

        return invoiceRepository.save(invoice);
    }

    public ProrationQuote calculateProration(Long sellerId, String targetPlanCode) {
        SubscriptionPlan targetPlan = planRepository.findByPlanCode(targetPlanCode)
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan: " + targetPlanCode));

        BigDecimal targetPrice = targetPlan.getPrice();
        Optional<SellerSubscription> currentSubOpt = subscriptionRepository.findBySellerId(sellerId);

        if (currentSubOpt.isEmpty() || !currentSubOpt.get().getStatus().isValidForEntitlements()) {
            return new ProrationQuote("FREE", targetPlanCode, BigDecimal.ZERO, targetPrice, targetPrice, 0);
        }

        SellerSubscription currentSub = currentSubOpt.get();
        Instant now = Instant.now();

        if (currentSub.getExpiresAt() == null || currentSub.getExpiresAt().isBefore(now)) {
            return new ProrationQuote(currentSub.getPlanCode(), targetPlanCode, BigDecimal.ZERO, targetPrice, targetPrice, 0);
        }

        Optional<SubscriptionPlan> currentPlanOpt = planRepository.findByPlanCode(currentSub.getPlanCode());
        BigDecimal currentPrice = currentPlanOpt.map(SubscriptionPlan::getPrice).orElse(BigDecimal.ZERO);

        long daysRemaining = ChronoUnit.DAYS.between(now, currentSub.getExpiresAt());
        if (daysRemaining <= 0 || currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return new ProrationQuote(currentSub.getPlanCode(), targetPlanCode, BigDecimal.ZERO, targetPrice, targetPrice, 0);
        }

        int planDuration = currentPlanOpt.map(SubscriptionPlan::getDurationDays).orElse(30);
        BigDecimal dailyRate = currentPrice.divide(BigDecimal.valueOf(planDuration), 4, RoundingMode.HALF_UP);
        BigDecimal unusedCredit = dailyRate.multiply(BigDecimal.valueOf(daysRemaining)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal netToPay = targetPrice.subtract(unusedCredit);
        if (netToPay.compareTo(BigDecimal.ZERO) < 0) {
            netToPay = BigDecimal.ZERO;
        }

        return new ProrationQuote(
                currentSub.getPlanCode(),
                targetPlanCode,
                unusedCredit,
                targetPrice,
                netToPay,
                daysRemaining
        );
    }

    @Transactional
    public void cancelSubscription(Long sellerId) {
        SellerSubscription sub = subscriptionRepository.findBySellerId(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found for seller: " + sellerId));

        sub.setAutoRenew(false);
        subscriptionRepository.save(sub);

        auditService.log(sellerId, "SUBSCRIPTION_AUTO_RENEW_CANCELLED", "SELLER_SUBSCRIPTION",
                sub.getId().toString(), "Cancelled auto-renewal. Access continues until " + sub.getExpiresAt(), null);
    }

    @Transactional(readOnly = true)
    public Page<Invoice> getSellerInvoices(Long sellerId, int page, int size) {
        return invoiceRepository.findBySellerIdOrderByIssuedAtDesc(sellerId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Optional<Invoice> getInvoice(UUID invoiceId) {
        return invoiceRepository.findById(invoiceId);
    }

    @Transactional(readOnly = true)
    public Optional<Invoice> getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber);
    }

    @Transactional(readOnly = true)
    public Page<BillingPayment> getSellerPayments(Long sellerId, int page, int size) {
        return paymentRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Optional<BillingPayment> getPayment(UUID paymentId) {
        return paymentRepository.findById(paymentId);
    }

    private String generateInvoiceNumber() {
        String ym = LocalDateTime.now().format(INVOICE_DATE_FORMAT);
        int randomSeq = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "INV-" + ym + "-" + randomSeq;
    }
}
