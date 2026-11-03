package com.suqafuran.messaging;

import com.suqafuran.security.JwtTokenProvider;
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
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MessagingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MessagingService messagingService;

    private String validJwtToken;

    @BeforeEach
    void setUp() {
        SecretKey key = Keys.hmacShaKeyFor("super-secret-key-for-unit-testing-32-bytes-long!".getBytes(StandardCharsets.UTF_8));
        validJwtToken = "Bearer " + Jwts.builder()
                .subject("55")
                .claim("email", "buyer55@example.com")
                .claim("is_admin", false)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
    }

    @Test
    void testEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/conversations"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/conversations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sellerId\": 99, \"listingId\": 10}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStartConversationWithValidAuth() throws Exception {
        Conversation mockConv = new Conversation(55L, 99L, 10L);
        when(messagingService.getOrCreateConversation(55L, 99L, 10L)).thenReturn(mockConv);

        mockMvc.perform(post("/api/v1/conversations")
                        .header("Authorization", validJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sellerId\": 99, \"listingId\": 10}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buyerId").value(55))
                .andExpect(jsonPath("$.sellerId").value(99))
                .andExpect(jsonPath("$.listingId").value(10));
    }

    @Test
    void testSendMessageWithValidAuth() throws Exception {
        UUID convId = UUID.randomUUID();
        ChatMessage mockMsg = new ChatMessage(convId, 55L, "Is the price negotiable?", null);
        when(messagingService.sendMessage(eq(55L), eq(convId), eq("Is the price negotiable?"), isNull()))
                .thenReturn(mockMsg);

        mockMvc.perform(post("/api/v1/conversations/" + convId + "/messages")
                        .header("Authorization", validJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\": \"Is the price negotiable?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Is the price negotiable?"))
                .andExpect(jsonPath("$.senderId").value(55));
    }

    @Test
    void testGetUnreadCount() throws Exception {
        when(messagingService.getTotalUnreadCount(55L)).thenReturn(7L);

        mockMvc.perform(get("/api/v1/conversations/unread-count")
                        .header("Authorization", validJwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(7));
    }

    @Test
    void testBlockUser() throws Exception {
        mockMvc.perform(post("/api/v1/users/88/block")
                        .header("Authorization", validJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Inappropriate behavior\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

