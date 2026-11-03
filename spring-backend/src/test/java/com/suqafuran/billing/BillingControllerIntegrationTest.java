package com.suqafuran.billing;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BillingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BillingService billingService;

    private String validJwtToken;

    @BeforeEach
    void setUp() {
        SecretKey key = Keys.hmacShaKeyFor("super-secret-key-for-unit-testing-32-bytes-long!".getBytes(StandardCharsets.UTF_8));
        validJwtToken = "Bearer " + Jwts.builder()
                .subject("99")
                .claim("email", "seller99@example.com")
                .claim("is_admin", false)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
    }

    @Test
    void testInitiateMpesaStkPushRequiresAuth() throws Exception {
        mockMvc.perform(post("/api/v1/billing/mpesa/stk-push")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planCode\": \"PRO\", \"phoneNumber\": \"0712345678\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testInitiateMpesaStkPushSuccess() throws Exception {
        BillingPayment mockPayment = new BillingPayment(
                99L, BigDecimal.valueOf(1999), "KES", "idem-stk", "254712345678", "Subscription: PRO"
        );
        mockPayment.setCheckoutRequestId("ws_CO_TEST");
        when(billingService.initiateMpesaPayment(eq(99L), eq("PRO"), eq("0712345678"), anyString()))
                .thenReturn(mockPayment);

        mockMvc.perform(post("/api/v1/billing/mpesa/stk-push")
                        .header("Authorization", validJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planCode\": \"PRO\", \"phoneNumber\": \"0712345678\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerId").value(99))
                .andExpect(jsonPath("$.amount").value(1999))
                .andExpect(jsonPath("$.checkoutRequestId").value("ws_CO_TEST"));
    }

    @Test
    void testMpesaWebhookIsPublic() throws Exception {
        BillingPayment processed = new BillingPayment(
                99L, BigDecimal.valueOf(1999), "KES", "idem-stk", "254712345678", "Subscription: PRO"
        );
        processed.setStatus(PaymentStatus.SUCCESSFUL);
        when(billingService.handleMpesaCallback(any())).thenReturn(processed);

        mockMvc.perform(post("/api/v1/billing/webhook/mpesa")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"Body\": {\"stkCallback\": {\"CheckoutRequestID\": \"ws_CO_TEST\", \"ResultCode\": 0}}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ResultCode").value(0))
                .andExpect(jsonPath("$.status").value("SUCCESSFUL"));
    }

    @Test
    void testGetProrationQuote() throws Exception {
        BillingService.ProrationQuote quote = new BillingService.ProrationQuote(
                "PRO", "BUSINESS", BigDecimal.valueOf(999.50), BigDecimal.valueOf(4999), BigDecimal.valueOf(3999.50), 15
        );
        when(billingService.calculateProration(99L, "BUSINESS")).thenReturn(quote);

        mockMvc.perform(get("/api/v1/billing/proration-quote?targetPlanCode=BUSINESS")
                        .header("Authorization", validJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPlan").value("PRO"))
                .andExpect(jsonPath("$.targetPlan").value("BUSINESS"))
                .andExpect(jsonPath("$.netAmountToPay").value(3999.50));
    }

    @Test
    void testGetInvoices() throws Exception {
        Invoice invoice = new Invoice(
                "INV-202611-1001", 99L, UUID.randomUUID(), "PRO", "Subscription",
                BigDecimal.valueOf(1999), BigDecimal.ZERO, BigDecimal.valueOf(1999), "KES"
        );
        when(billingService.getSellerInvoices(eq(99L), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(invoice)));

        mockMvc.perform(get("/api/v1/billing/invoices")
                        .header("Authorization", validJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].invoiceNumber").value("INV-202611-1001"))
                .andExpect(jsonPath("$.content[0].totalAmount").value(1999));
    }
}

