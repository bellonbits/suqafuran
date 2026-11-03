package com.suqafuran.messaging;

import com.suqafuran.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    public record CreateConversationRequest(Long sellerId, Long listingId) {}
    public record SendMessageRequest(String content, String attachmentUrl) {}
    public record TypingRequest(boolean isTyping) {}
    public record ArchiveRequest(boolean archive) {}
    public record MuteRequest(boolean mute) {}
    public record BlockUserRequest(String reason) {}
    public record ReportMessageRequest(String reason, String details) {}

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Page<Conversation> conversations = messagingService.getUserConversations(user.getId(), page, size);
        return ResponseEntity.ok(conversations);
    }

    @PostMapping("/conversations")
    public ResponseEntity<?> startConversation(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody CreateConversationRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            Conversation conv = messagingService.getOrCreateConversation(user.getId(), request.sellerId(), request.listingId());
            return ResponseEntity.ok(conv);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getMessages(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            Page<ChatMessage> messages = messagingService.getConversationMessages(user.getId(), id, page, size);
            return ResponseEntity.ok(messages);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<?> sendMessage(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id,
            @RequestBody SendMessageRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            ChatMessage message = messagingService.sendMessage(user.getId(), id, request.content(), request.attachmentUrl());
            return ResponseEntity.ok(message);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/conversations/{id}/read")
    public ResponseEntity<?> markAsRead(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            messagingService.markConversationAsRead(user.getId(), id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/conversations/{id}/typing")
    public ResponseEntity<?> setTyping(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id,
            @RequestBody TypingRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        messagingService.sendTypingIndicator(user.getId(), id, request.isTyping());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/conversations/{id}/archive")
    public ResponseEntity<?> setArchive(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id,
            @RequestBody ArchiveRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        messagingService.toggleArchive(user.getId(), id, request.archive());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/conversations/{id}/mute")
    public ResponseEntity<?> setMute(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID id,
            @RequestBody MuteRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        messagingService.toggleMute(user.getId(), id, request.mute());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/conversations/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Long unread = messagingService.getTotalUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", unread));
    }

    @PostMapping("/users/{userId}/block")
    public ResponseEntity<?> blockUser(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long userId,
            @RequestBody(required = false) BlockUserRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String reason = (request != null) ? request.reason() : null;
        messagingService.blockUser(user.getId(), userId, reason);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/users/{userId}/block")
    public ResponseEntity<?> unblockUser(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long userId
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        messagingService.unblockUser(user.getId(), userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/messages/{messageId}/report")
    public ResponseEntity<?> reportMessage(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable UUID messageId,
            @RequestBody ReportMessageRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        MessageReport report = messagingService.reportMessage(user.getId(), messageId, request.reason(), request.details());
        return ResponseEntity.ok(report);
    }
}

