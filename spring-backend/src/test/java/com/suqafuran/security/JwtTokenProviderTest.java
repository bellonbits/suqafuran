package com.suqafuran.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private final String secret = "super-secret-key-for-unit-testing-32-bytes-long!";
    private JwtTokenProvider tokenProvider;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret);
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void testValidToken() {
        String token = Jwts.builder()
                .subject("42")
                .claim("email", "seller@example.com")
                .claim("is_admin", false)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();

        assertTrue(tokenProvider.validateToken(token));
        assertEquals(42L, tokenProvider.getUserIdFromToken(token));
        assertEquals("seller@example.com", tokenProvider.getClaimsFromToken(token).get("email"));
    }

    @Test
    void testExpiredToken() {
        String expiredToken = Jwts.builder()
                .subject("42")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(key)
                .compact();

        assertFalse(tokenProvider.validateToken(expiredToken));
    }

    @Test
    void testTamperedToken() {
        String token = Jwts.builder()
                .subject("42")
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();

        String tampered = token + "xyz";
        assertFalse(tokenProvider.validateToken(tampered));
    }
}

