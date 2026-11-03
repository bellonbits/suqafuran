package com.suqafuran.messaging;

import com.suqafuran.audit.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MessagingService {

    private static final Logger logger = LoggerFactory.getLogger(MessagingService.class);
    public static final String CHAT_CHANNEL = "suqafuran:chat:events";

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final MessageReportRepository reportRepository;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;

    public MessagingService(
            ConversationRepository conversationRepository,
            ChatMessageRepository messageRepository,
            BlockedUserRepository blockedUserRepository,
            MessageReportRepository reportRepository,
            AuditService auditService,
            @Autowired(required = false) SimpMessagingTemplate messagingTemplate,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.blockedUserRepository = blockedUserRepository;
        this.reportRepository = reportRepository;
        this.auditService = auditService;
        this.messagingTemplate = messagingTemplate;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Conversation getOrCreateConversation(Long buyerId, Long sellerId, Long listingId) {
        if (buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("Buyers cannot start a conversation with themselves");
        }

        if (isBlocked(buyerId, sellerId)) {
            throw new IllegalStateException("Cannot initiate conversation: communication is blocked between these users");
        }

        return conversationRepository.findByBuyerIdAndSellerIdAndListingId(buyerId, sellerId, listingId)
                .orElseGet(() -> {
                    Conversation c = new Conversation(buyerId, sellerId, listingId);
                    Conversation saved = conversationRepository.save(c);
                    auditService.log(buyerId, "CONVERSATION_CREATED", "CONVERSATION", saved.getId().toString(),
                            "Listing ID: " + listingId, null);
                    return saved;
                });
    }

    @Transactional
    public ChatMessage sendMessage(Long senderId, UUID conversationId, String content, String attachmentUrl) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        if (!conversation.getBuyerId().equals(senderId) && !conversation.getSellerId().equals(senderId)) {
            throw new SecurityException("User is not a participant in this conversation");
        }

        Long recipientId = conversation.getBuyerId().equals(senderId)
                ? conversation.getSellerId()
                : conversation.getBuyerId();

        if (isBlocked(senderId, recipientId)) {
            throw new IllegalStateException("Message cannot be delivered: user has blocked communication");
        }

        ChatMessage message = new ChatMessage(conversationId, senderId, content.trim(), attachmentUrl);
        ChatMessage saved = messageRepository.save(message);

        // Update conversation summary and increment recipient unread count
        String preview = content.length() > 100 ? content.substring(0, 97) + "..." : content;
        conversation.setLastMessagePreview(preview);
        conversation.setLastMessageAt(Instant.now());

        if (conversation.getBuyerId().equals(senderId)) {
            conversation.setSellerUnreadCount(conversation.getSellerUnreadCount() + 1);
            conversation.setIsArchivedBySeller(false); // Unarchive for recipient upon new message
        } else {
            conversation.setBuyerUnreadCount(conversation.getBuyerUnreadCount() + 1);
            conversation.setIsArchivedByBuyer(false);
        }
        conversationRepository.save(conversation);

        // Broadcast real-time event
        broadcastChatEvent(new ChatEvent(
                "NEW_MESSAGE",
                conversationId,
                saved.getId(),
                senderId,
                recipientId,
                saved.getContent(),
                saved.getAttachmentUrl(),
                false,
                saved.getCreatedAt()
        ));

        return saved;
    }

    @Transactional
    public void markConversationAsRead(Long userId, UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        if (!conversation.getBuyerId().equals(userId) && !conversation.getSellerId().equals(userId)) {
            throw new SecurityException("User is not a participant in this conversation");
        }

        Long counterpartyId;
        if (conversation.getBuyerId().equals(userId)) {
            conversation.setBuyerUnreadCount(0);
            counterpartyId = conversation.getSellerId();
        } else {
            conversation.setSellerUnreadCount(0);
            counterpartyId = conversation.getBuyerId();
        }
        conversationRepository.save(conversation);

        // Mark unread messages sent by counterparty as read
        List<ChatMessage> unreadMessages = messageRepository.findByConversationIdAndSenderIdNotAndIsReadFalse(
                conversationId, userId
        );
        Instant now = Instant.now();
        for (ChatMessage msg : unreadMessages) {
            msg.setIsRead(true);
            msg.setReadAt(now);
            msg.setDeliveryStatus("READ");
        }
        messageRepository.saveAll(unreadMessages);

        // Notify counterparty of read receipts
        broadcastChatEvent(new ChatEvent(
                "READ_RECEIPT",
                conversationId,
                null,
                userId,
                counterpartyId,
                null,
                null,
                false,
                now
        ));
    }

    public void sendTypingIndicator(Long userId, UUID conversationId, boolean isTyping) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) return;

        Long counterpartyId = conversation.getBuyerId().equals(userId)
                ? conversation.getSellerId()
                : conversation.getBuyerId();

        broadcastChatEvent(new ChatEvent(
                "TYPING",
                conversationId,
                null,
                userId,
                counterpartyId,
                null,
                null,
                isTyping,
                Instant.now()
        ));
    }

    @Transactional
    public void toggleArchive(Long userId, UUID conversationId, boolean archive) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (conversation.getBuyerId().equals(userId)) {
            conversation.setIsArchivedByBuyer(archive);
        } else if (conversation.getSellerId().equals(userId)) {
            conversation.setIsArchivedBySeller(archive);
        } else {
            throw new SecurityException("User is not a participant");
        }
        conversationRepository.save(conversation);
    }

    @Transactional
    public void toggleMute(Long userId, UUID conversationId, boolean mute) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (conversation.getBuyerId().equals(userId)) {
            conversation.setIsMutedByBuyer(mute);
        } else if (conversation.getSellerId().equals(userId)) {
            conversation.setIsMutedBySeller(mute);
        } else {
            throw new SecurityException("User is not a participant");
        }
        conversationRepository.save(conversation);
    }

    @Transactional
    public void blockUser(Long blockerId, Long blockedId, String reason) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        if (!blockedUserRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            BlockedUser block = new BlockedUser(blockerId, blockedId, reason);
            blockedUserRepository.save(block);
            auditService.log(blockerId, "USER_BLOCKED", "USER", blockedId.toString(), reason, null);
        }
    }

    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        blockedUserRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .ifPresent(b -> {
                    blockedUserRepository.delete(b);
                    auditService.log(blockerId, "USER_UNBLOCKED", "USER", blockedId.toString(), null, null);
                });
    }

    @Transactional
    public MessageReport reportMessage(Long reporterId, UUID messageId, String reason, String details) {
        ChatMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        MessageReport report = new MessageReport(messageId, reporterId, reason, details);
        MessageReport saved = reportRepository.save(report);

        auditService.log(reporterId, "MESSAGE_REPORTED", "CHAT_MESSAGE", messageId.toString(),
                "Reason: " + reason + "; Details: " + details, null);

        return saved;
    }

    public boolean isBlocked(Long userA, Long userB) {
        return blockedUserRepository.existsByBlockerIdAndBlockedId(userA, userB)
                || blockedUserRepository.existsByBlockerIdAndBlockedId(userB, userA);
    }

    @Transactional(readOnly = true)
    public Page<Conversation> getUserConversations(Long userId, int page, int size) {
        return conversationRepository.findActiveConversationsForUser(userId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Page<ChatMessage> getConversationMessages(Long userId, UUID conversationId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!conversation.getBuyerId().equals(userId) && !conversation.getSellerId().equals(userId)) {
            throw new SecurityException("User is not a participant in this conversation");
        }

        return messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Long getTotalUnreadCount(Long userId) {
        return conversationRepository.countTotalUnreadForUser(userId);
    }

    private void broadcastChatEvent(ChatEvent event) {
        try {
            // 1. Direct local WebSocket delivery via STOMP broker
            if (messagingTemplate != null) {
                // To the conversation room
                messagingTemplate.convertAndSend("/topic/conversation." + event.conversationId(), event);

                // Specific user queue
                if (event.recipientId() != null) {
                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(event.recipientId()),
                            "/queue/messages",
                            event
                    );
                }
            }

            // 2. Publish to Redis backplane so sibling instances receive it
            if (redisTemplate != null) {
                String payload = String.format("{\"eventType\":\"%s\",\"conversationId\":\"%s\",\"senderId\":%d,\"recipientId\":%d}",
                        event.eventType(), event.conversationId(), event.senderId(), event.recipientId());
                redisTemplate.convertAndSend(CHAT_CHANNEL, payload);
            }
        } catch (Exception e) {
            logger.warn("Non-fatal: failed to broadcast chat event: {}", e.getMessage());
        }
    }
}

