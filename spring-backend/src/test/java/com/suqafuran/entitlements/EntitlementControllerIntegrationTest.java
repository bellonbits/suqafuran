package com.suqafuran.entitlements;

import com.suqafuran.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EntitlementControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EntitlementService entitlementService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void testInternalEndpointRequiresValidApiKey() throws Exception {
        // Without header -> 401
        mockMvc.perform(get("/internal/v1/entitlements/sellers/42"))
                .andExpect(status().isUnauthorized());

        // With invalid header -> 401
        mockMvc.perform(get("/internal/v1/entitlements/sellers/42")
                        .header("X-Internal-Service-Key", "wrong-key"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testInternalEndpointWithValidApiKeySucceeds() throws Exception {
        EntitlementResponse mockResponse = new EntitlementResponse(
                42L, "free", "active", null,
                new EntitlementLimits(10, 2, true, 1),
                List.of("BASIC_SUPPORT")
        );
        when(entitlementService.getSellerEntitlements(eq(42L), anyInt())).thenReturn(mockResponse);

        mockMvc.perform(get("/internal/v1/entitlements/sellers/42")
                        .header("X-Internal-Service-Key", "test-internal-service-key-2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerId").value(42))
                .andExpect(jsonPath("$.plan").value("free"))
                .andExpect(jsonPath("$.limits.maxActiveListings").value(10))
                .andExpect(jsonPath("$.limits.canCreateListing").value(true));
    }
}
