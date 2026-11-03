package com.suqafuran.messaging;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

public record ChatEvent(
        String eventType, // NEW_MESSAGE, READ_RECEIPT, TYPING, DELIVERY_STATUS
        UUID conversationId,
        UUID messageId,
        Long senderId,
        Long recipientId,
        String content,
        String attachmentUrl,
        boolean isTyping,
        Instant timestamp
) implements Serializable {}

