package com.suqafuran.billing;

import com.suqafuran.audit.AuditService;
import com.suqafuran.subscriptions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

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

class BillingServiceTest {

    private BillingPaymentRepository paymentRepository;
    private InvoiceRepository invoiceRepository;
    private SellerSubscriptionRepository subscriptionRepository;
    private SubscriptionPlanRepository planRepository;
    private AuditService auditService;
    private MpesaClient mpesaClient;
    private BillingService billingService;

    @BeforeEach
    void setUp() {
        paymentRepository = Mockito.mock(BillingPaymentRepository.class);
        invoiceRepository = Mockito.mock(InvoiceRepository.class);
        subscriptionRepository = Mockito.mock(SellerSubscriptionRepository.class);
        planRepository = Mockito.mock(SubscriptionPlanRepository.class);
        auditService = Mockito.mock(AuditService.class);
        mpesaClient = Mockito.mock(MpesaClient.class);

        billingService = new BillingService(
                paymentRepository,
                invoiceRepository,
                subscriptionRepository,
                planRepository,
                auditService,
                mpesaClient
        );
    }

    @Test
    void testInitiateMpesaPaymentSuccess() {
        when(paymentRepository.findByIdempotencyKeyAndSellerId("idem-123", 50L)).thenReturn(Optional.empty());
        when(planRepository.findByPlanCode("PRO")).thenReturn(Optional.of(
                new SubscriptionPlan("PRO", "Pro Plan", BigDecimal.valueOf(1999), "KES", 30, 50, "[]")
        ));
        when(subscriptionRepository.findBySellerId(50L)).thenReturn(Optional.empty());
        when(mpesaClient.normalizePhoneNumber("0712345678")).thenReturn("254712345678");
        when(mpesaClient.initiateStkPush(eq("254712345678"), any(), any(), any()))
                .thenReturn(new MpesaClient.StkPushResult("MR_100", "ws_CO_200", "0", "Accepted", "Success"));

        when(paymentRepository.save(any(BillingPayment.class))).thenAnswer(i -> i.getArgument(0));

        BillingPayment payment = billingService.initiateMpesaPayment(
                50L,
                "PRO",
                "0712345678",
                "idem-123"
        );

        assertNotNull(payment);
        assertEquals(50L, payment.getSellerId());
        assertEquals("PRO", payment.getPlanCode());
        assertEquals(BigDecimal.valueOf(1999), payment.getAmount());
        assertEquals("ws_CO_200", payment.getCheckoutRequestId());
        assertEquals("MR_100", payment.getMerchantRequestId());
        verify(paymentRepository, atLeastOnce()).save(any(BillingPayment.class));
        verify(auditService).log(eq(50L), eq("MPESA_STK_PUSH_INITIATED"), any(), any(), any(), any());
    }

    @Test
    void testInitiatePaymentIdempotentReturn() {
        BillingPayment existing = new BillingPayment(
                50L, BigDecimal.valueOf(1999), "KES", "idem-123", "254712345678", "Subscription: PRO"
        );
        when(paymentRepository.findByIdempotencyKeyAndSellerId("idem-123", 50L)).thenReturn(Optional.of(existing));

        BillingPayment payment = billingService.initiateMpesaPayment(
                50L,
                "PRO",
                "0712345678",
                "idem-123"
        );

        assertSame(existing, payment);
        verify(mpesaClient, never()).initiateStkPush(any(), any(), any(), any());
    }

    @Test
    void testHandleMpesaCallbackSuccessIssuesInvoiceAndActivatesSubscription() {
        BillingPayment pending = new BillingPayment(
                50L, BigDecimal.valueOf(1999), "KES", "idem-999", "254712345678", "Subscription: PRO"
        );
        pending.setPlanCode("PRO");
        pending.setCheckoutRequestId("ws_CO_999");
        when(paymentRepository.findByCheckoutRequestId("ws_CO_999")).thenReturn(Optional.of(pending));
        when(paymentRepository.save(any(BillingPayment.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionPlan proPlan = new SubscriptionPlan(
                "PRO", "Pro Plan", BigDecimal.valueOf(1999), "KES", 30, 50, "[]"
        );
        when(planRepository.findByPlanCode("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findBySellerId(50L)).thenReturn(Optional.empty());

        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> callbackPayload = Map.of(
                "Body", Map.of(
                        "stkCallback", Map.of(
                                "MerchantRequestID", "MR_999",
                                "CheckoutRequestID", "ws_CO_999",
                                "ResultCode", 0,
                                "ResultDesc", "The service request is processed successfully.",
                                "CallbackMetadata", Map.of(
                                        "Item", List.of(
                                                Map.of("Name", "Amount", "Value", 1999.0),
                                                Map.of("Name", "MpesaReceiptNumber", "Value", "NLJ7RT61SV")
                                        )
                                )
                        )
                )
        );

        BillingPayment processed = billingService.handleMpesaCallback(callbackPayload);

        assertEquals(PaymentStatus.SUCCESSFUL, processed.getStatus());
        assertEquals("NLJ7RT61SV", processed.getProviderTransactionId());
        assertNotNull(processed.getInvoiceNumber());
        assertTrue(processed.getInvoiceNumber().startsWith("INV-"));

        verify(invoiceRepository, times(1)).save(any(Invoice.class));
        verify(subscriptionRepository, times(1)).save(any(SellerSubscription.class));
        verify(auditService).log(eq(50L), eq("SUBSCRIPTION_ACTIVATED"), any(), any(), any(), any());
    }

    @Test
    void testHandleMpesaCallbackFailedSetsPaymentFailed() {
        BillingPayment pending = new BillingPayment(
                50L, BigDecimal.valueOf(1999), "KES", "idem-fail", "254712345678", "Subscription: PRO"
        );
        pending.setCheckoutRequestId("ws_CO_FAIL");
        when(paymentRepository.findByCheckoutRequestId("ws_CO_FAIL")).thenReturn(Optional.of(pending));
        when(paymentRepository.save(any(BillingPayment.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> callbackPayload = Map.of(
                "Body", Map.of(
                        "stkCallback", Map.of(
                                "MerchantRequestID", "MR_FAIL",
                                "CheckoutRequestID", "ws_CO_FAIL",
                                "ResultCode", 1032,
                                "ResultDesc", "Request cancelled by user"
                        )
                )
        );

        BillingPayment processed = billingService.handleMpesaCallback(callbackPayload);

        assertEquals(PaymentStatus.FAILED, processed.getStatus());
        assertEquals("Request cancelled by user", processed.getErrorMessage());
        verify(invoiceRepository, never()).save(any());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void testCalculateProrationUpgradeFromProToBusiness() {
        SubscriptionPlan businessPlan = new SubscriptionPlan(
                "BUSINESS", "Enterprise Business", BigDecimal.valueOf(4999), "KES", 30, 200, "[]"
        );
        when(planRepository.findByPlanCode("BUSINESS")).thenReturn(Optional.of(businessPlan));

        SubscriptionPlan proPlan = new SubscriptionPlan(
                "PRO", "Pro Plan", BigDecimal.valueOf(1999), "KES", 30, 50, "[]"
        );
        when(planRepository.findByPlanCode("PRO")).thenReturn(Optional.of(proPlan));

        // Seller has active PRO subscription with 15 days remaining
        SellerSubscription currentSub = new SellerSubscription(
                60L, "PRO", Instant.now().plus(15, ChronoUnit.DAYS)
        );
        currentSub.setStatus(SubscriptionStatus.ACTIVE);
        when(subscriptionRepository.findBySellerId(60L)).thenReturn(Optional.of(currentSub));

        BillingService.ProrationQuote quote = billingService.calculateProration(60L, "BUSINESS");

        assertNotNull(quote);
        assertEquals("PRO", quote.currentPlan());
        assertEquals("BUSINESS", quote.targetPlan());
        assertEquals(BigDecimal.valueOf(4999), quote.targetPlanPrice());
        // ~1999 / 30 * 15 = ~999.50 credit
        assertTrue(quote.currentPlanRemainingCredit().compareTo(BigDecimal.valueOf(900)) > 0);
        // ~4999 - ~999.50 = ~3999.50 net
        assertTrue(quote.netAmountToPay().compareTo(BigDecimal.valueOf(4100)) < 0);
    }

    @Test
    void testCancelSubscriptionDisablesAutoRenew() {
        SellerSubscription sub = new SellerSubscription(70L, "PRO", Instant.now().plus(20, ChronoUnit.DAYS));
        sub.setAutoRenew(true);
        when(subscriptionRepository.findBySellerId(70L)).thenReturn(Optional.of(sub));

        billingService.cancelSubscription(70L);

        assertFalse(sub.getAutoRenew());
        verify(subscriptionRepository).save(sub);
        verify(auditService).log(eq(70L), eq("SUBSCRIPTION_AUTO_RENEW_CANCELLED"), any(), any(), any(), any());
    }
}
