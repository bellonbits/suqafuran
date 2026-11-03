package com.suqafuran.promotions;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
class PromotionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PromotionService promotionService;

    private String validJwtToken;

    @BeforeEach
    void setUp() {
        SecretKey key = Keys.hmacShaKeyFor("super-secret-key-for-unit-testing-32-bytes-long!".getBytes(StandardCharsets.UTF_8));
        validJwtToken = "Bearer " + Jwts.builder()
                .subject("80")
                .claim("email", "seller80@example.com")
                .claim("is_admin", false)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
    }

    @Test
    void testGetPackagesIsPublic() throws Exception {
        PromotionPackage pkg = new PromotionPackage(
                "BOOST_7_DAYS", "7-Day Boost", "TOP_SEARCH_BOOST", 1, 7, BigDecimal.valueOf(599), "KES", "Desc"
        );
        when(promotionService.getActivePackages()).thenReturn(List.of(pkg));

        mockMvc.perform(get("/api/v1/promotions/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].packageCode").value("BOOST_7_DAYS"))
                .andExpect(jsonPath("$[0].price").value(599));
    }

    @Test
    void testActivatePromotionRequiresAuth() throws Exception {
        mockMvc.perform(post("/api/v1/promotions/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"listingId\": 101, \"packageCode\": \"BOOST_7_DAYS\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testActivatePromotionWithAuthSuccess() throws Exception {
        PromotedListing promo = new PromotedListing();
        promo.setListingId(101L);
        promo.setSellerId(80L);
        promo.setPackageCode("BOOST_7_DAYS");
        promo.setBoostLevel(1);
        when(promotionService.activatePromotion(eq(80L), eq(101L), eq("BOOST_7_DAYS"), isNull()))
                .thenReturn(promo);

        mockMvc.perform(post("/api/v1/promotions/activate")
                        .header("Authorization", validJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"listingId\": 101, \"packageCode\": \"BOOST_7_DAYS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listingId").value(101))
                .andExpect(jsonPath("$.sellerId").value(80))
                .andExpect(jsonPath("$.packageCode").value("BOOST_7_DAYS"));
    }

    @Test
    void testInternalBoostLevelsEndpointRequiresServiceKey() throws Exception {
        // Without service key -> 401
        mockMvc.perform(post("/internal/v1/promotions/boost-levels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"listingIds\": [101, 102]}"))
                .andExpect(status().isUnauthorized());

        // With valid service key -> 200
        when(promotionService.getActiveBoostLevels(List.of(101L, 102L)))
                .thenReturn(Map.of(101L, 2));

        mockMvc.perform(post("/internal/v1/promotions/boost-levels")
                        .header("X-Internal-Service-Key", "test-internal-service-key-2026")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"listingIds\": [101, 102]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.101").value(2));
    }
}

