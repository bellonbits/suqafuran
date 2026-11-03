package com.suqafuran.billing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Component
public class MpesaClient {

    private static final Logger logger = LoggerFactory.getLogger(MpesaClient.class);
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final MpesaProperties properties;
    private final RestTemplate restTemplate;

    public MpesaClient(MpesaProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
    }

    public record StkPushResult(
            String merchantRequestId,
            String checkoutRequestId,
            String responseCode,
            String responseDescription,
            String customerMessage
    ) {}

    public String normalizePhoneNumber(String phone) {
        if (phone == null) return "";
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("0")) {
            return "254" + cleaned.substring(1);
        } else if (cleaned.startsWith("254")) {
            return cleaned;
        } else if (cleaned.length() == 9) {
            return "254" + cleaned;
        }
        return cleaned;
    }

    public String generatePassword(String shortcode, String passkey, String timestamp) {
        String data = shortcode + passkey + timestamp;
        return Base64.getEncoder().encodeToString(data.getBytes(StandardCharsets.UTF_8));
    }

    public StkPushResult initiateStkPush(String phoneNumber, BigDecimal amount, String accountReference, String transactionDesc) {
        String formattedPhone = normalizePhoneNumber(phoneNumber);
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        String password = generatePassword(properties.getBusinessShortcode(), properties.getPasskey(), timestamp);

        // If credentials are not set (e.g. dev/sandbox mock), return clean simulated response
        if (properties.getConsumerKey() == null || properties.getConsumerKey().isBlank() || "test-key".equals(properties.getConsumerKey())) {
            String mockCheckoutId = "ws_CO_" + timestamp + "_" + UUID.randomUUID().toString().substring(0, 8);
            String mockMerchantId = "MR_" + timestamp + "_" + UUID.randomUUID().toString().substring(0, 6);
            logger.info("Mock M-Pesa STK push for {} amount {} KES (CheckoutRequestId: {})", formattedPhone, amount, mockCheckoutId);
            return new StkPushResult(mockMerchantId, mockCheckoutId, "0", "Success. Request accepted for processing", "Success");
        }

        try {
            String token = fetchAccessToken();
            String url = properties.getBaseUrl() + "/mpesa/stkpush/v1/processrequest";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("BusinessShortCode", properties.getBusinessShortcode());
            body.put("Password", password);
            body.put("Timestamp", timestamp);
            body.put("TransactionType", "CustomerPayBillOnline");
            body.put("Amount", amount.intValue());
            body.put("PartyA", formattedPhone);
            body.put("PartyB", properties.getBusinessShortcode());
            body.put("PhoneNumber", formattedPhone);
            body.put("CallBackURL", properties.getCallbackUrl());
            body.put("AccountReference", accountReference);
            body.put("TransactionDesc", transactionDesc != null ? transactionDesc : "Suqafuran Subscription");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<?, ?> res = response.getBody();
                return new StkPushResult(
                        (String) res.get("MerchantRequestID"),
                        (String) res.get("CheckoutRequestID"),
                        (String) res.get("ResponseCode"),
                        (String) res.get("ResponseDescription"),
                        (String) res.get("CustomerMessage")
                );
            }
        } catch (Exception e) {
            logger.error("Failed to execute M-Pesa STK push: {}", e.getMessage(), e);
        }

        return new StkPushResult(null, null, "1", "STK push failed", "Failed to initiate payment");
    }

    private String fetchAccessToken() {
        String auth = properties.getConsumerKey() + ":" + properties.getConsumerSecret();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        String url = properties.getBaseUrl() + "/oauth/v1/generate?grant_type=client_credentials";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);

        HttpEntity<?> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return (String) response.getBody().get("access_token");
        }
        throw new IllegalStateException("Failed to obtain M-Pesa OAuth access token");
    }
}
