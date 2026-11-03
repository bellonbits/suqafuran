package com.suqafuran.billing;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.mpesa")
public class MpesaProperties {

    private String baseUrl = "https://sandbox.safaricom.co.ke";
    private String consumerKey = "";
    private String consumerSecret = "";
    private String businessShortcode = "174379";
    private String passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    private String callbackUrl = "https://app.suqafuran.com/api/v1/billing/webhook/mpesa";

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getConsumerKey() { return consumerKey; }
    public void setConsumerKey(String consumerKey) { this.consumerKey = consumerKey; }
    public String getConsumerSecret() { return consumerSecret; }
    public void setConsumerSecret(String consumerSecret) { this.consumerSecret = consumerSecret; }
    public String getBusinessShortcode() { return businessShortcode; }
    public void setBusinessShortcode(String businessShortcode) { this.businessShortcode = businessShortcode; }
    public String getPasskey() { return passkey; }
    public void setPasskey(String passkey) { this.passkey = passkey; }
    public String getCallbackUrl() { return callbackUrl; }
    public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }
}

