package com.suqafuran.messaging;

import com.suqafuran.audit.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MessagingServiceTest {

    private ConversationRepository conversationRepository;
    private ChatMessageRepository messageRepository;
    private BlockedUserRepository blockedUserRepository;
    private MessageReportRepository reportRepository;
    private AuditService auditService;
    private SimpMessagingTemplate messagingTemplate;
    private StringRedisTemplate redisTemplate;
    private MessagingService messagingService;

    @BeforeEach
    void setUp() {
        conversationRepository = Mockito.mock(ConversationRepository.class);
        messageRepository = Mockito.mock(ChatMessageRepository.class);
        blockedUserRepository = Mockito.mock(BlockedUserRepository.class);
        reportRepository = Mockito.mock(MessageReportRepository.class);
        auditService = Mockito.mock(AuditService.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);
        redisTemplate = Mockito.mock(StringRedisTemplate.class);

        messagingService = new MessagingService(
                conversationRepository,
                messageRepository,
                blockedUserRepository,
                reportRepository,
                auditService,
                messagingTemplate,
                redisTemplate
        );
    }

    @Test
    void testCannotStartConversationWithSelf() {
        assertThrows(IllegalArgumentException.class, () ->
                messagingService.getOrCreateConversation(10L, 10L, 500L)
        );
    }

    @Test
    void testCannotStartConversationIfBlocked() {
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(10L, 20L)).thenReturn(true);

        assertThrows(IllegalStateException.class, () ->
                messagingService.getOrCreateConversation(10L, 20L, 500L)
        );
    }

    @Test
    void testGetOrCreateConversationSuccess() {
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(10L, 20L)).thenReturn(false);
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(20L, 10L)).thenReturn(false);
        when(conversationRepository.findByBuyerIdAndSellerIdAndListingId(10L, 20L, 500L))
                .thenReturn(Optional.empty());

        Conversation mockConv = new Conversation(10L, 20L, 500L);
        when(conversationRepository.save(any(Conversation.class))).thenReturn(mockConv);

        Conversation conv = messagingService.getOrCreateConversation(10L, 20L, 500L);

        assertNotNull(conv);
        assertEquals(10L, conv.getBuyerId());
        assertEquals(20L, conv.getSellerId());
        verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    void testSendMessageUpdatesUnreadCounterAndBroadcasts() {
        UUID convId = UUID.randomUUID();
        Conversation conv = new Conversation(10L, 20L, 500L);
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(conv));
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(10L, 20L)).thenReturn(false);
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(20L, 10L)).thenReturn(false);

        ChatMessage mockMessage = new ChatMessage(convId, 10L, "Is this phone available?", null);
        when(messageRepository.save(any(ChatMessage.class))).thenReturn(mockMessage);
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(i -> i.getArgument(0));

        ChatMessage result = messagingService.sendMessage(10L, convId, "Is this phone available?", null);

        assertNotNull(result);
        assertEquals(1, conv.getSellerUnreadCount());
        assertEquals("Is this phone available?", conv.getLastMessagePreview());
        verify(messagingTemplate).convertAndSend(eq("/topic/conversation." + convId), any(ChatEvent.class));
        verify(messagingTemplate).convertAndSendToUser(eq("20"), eq("/queue/messages"), any(ChatEvent.class));
    }

    @Test
    void testSendMessageBlockedThrowsException() {
        UUID convId = UUID.randomUUID();
        Conversation conv = new Conversation(10L, 20L, 500L);
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(conv));
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(20L, 10L)).thenReturn(true); // seller blocked buyer

        assertThrows(IllegalStateException.class, () ->
                messagingService.sendMessage(10L, convId, "Hello", null)
        );
    }

    @Test
    void testMarkConversationAsReadResetsUnreadAndMarksMessages() {
        UUID convId = UUID.randomUUID();
        Conversation conv = new Conversation(10L, 20L, 500L);
        conv.setSellerUnreadCount(5);
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(conv));

        ChatMessage msg1 = new ChatMessage(convId, 10L, "Hi", null);
        when(messageRepository.findByConversationIdAndSenderIdNotAndIsReadFalse(convId, 20L))
                .thenReturn(List.of(msg1));

        messagingService.markConversationAsRead(20L, convId);

        assertEquals(0, conv.getSellerUnreadCount());
        assertTrue(msg1.getIsRead());
        assertEquals("READ", msg1.getDeliveryStatus());
        verify(messageRepository).saveAll(any());
        verify(messagingTemplate).convertAndSend(eq("/topic/conversation." + convId), any(ChatEvent.class));
    }

    @Test
    void testBlockAndUnblockUser() {
        when(blockedUserRepository.existsByBlockerIdAndBlockedId(10L, 20L)).thenReturn(false);

        messagingService.blockUser(10L, 20L, "Spam harassment");
        verify(blockedUserRepository).save(any(BlockedUser.class));

        BlockedUser existing = new BlockedUser(10L, 20L, "Spam");
        when(blockedUserRepository.findByBlockerIdAndBlockedId(10L, 20L)).thenReturn(Optional.of(existing));

        messagingService.unblockUser(10L, 20L);
        verify(blockedUserRepository).delete(existing);
    }

    @Test
    void testReportMessage() {
        UUID msgId = UUID.randomUUID();
        ChatMessage msg = new ChatMessage(UUID.randomUUID(), 10L, "Offensive content", null);
        when(messageRepository.findById(msgId)).thenReturn(Optional.of(msg));

        MessageReport report = new MessageReport(msgId, 20L, "SPAM", "Advertising unrelated link");
        when(reportRepository.save(any(MessageReport.class))).thenReturn(report);

        MessageReport saved = messagingService.reportMessage(20L, msgId, "SPAM", "Advertising unrelated link");
        assertNotNull(saved);
        verify(reportRepository).save(any(MessageReport.class));
        verify(auditService).log(eq(20L), eq("MESSAGE_REPORTED"), eq("CHAT_MESSAGE"), eq(msgId.toString()), any(), any());
    }
}

