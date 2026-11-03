package com.suqafuran.messaging;

import com.suqafuran.security.JwtTokenProvider;
import com.suqafuran.security.UserPrincipal;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthChannelInterceptor.class);

    private final JwtTokenProvider tokenProvider;

    public WebSocketAuthChannelInterceptor(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = resolveToken(accessor);

            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                Long userId = tokenProvider.getUserIdFromToken(token);
                if (userId != null) {
                    Claims claims = tokenProvider.getClaimsFromToken(token);
                    Boolean isAdmin = claims.get("is_admin", Boolean.class);
                    String email = claims.get("email", String.class);

                    UserPrincipal principal = UserPrincipal.create(userId, email, Boolean.TRUE.equals(isAdmin));
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

                    accessor.setUser(auth);
                    logger.debug("STOMP WebSocket authenticated user: {}", userId);
                }
            } else {
                logger.warn("STOMP WebSocket CONNECT without valid token");
            }
        }

        return message;
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        // 1. Try Native STOMP Header 'Authorization'
        String bearerToken = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // 2. Try 'token' native header
        String rawToken = accessor.getFirstNativeHeader("token");
        if (StringUtils.hasText(rawToken)) {
            return rawToken;
        }

        return null;
    }
}

