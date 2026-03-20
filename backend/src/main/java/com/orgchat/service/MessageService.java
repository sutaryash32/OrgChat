package com.orgchat.service;

import com.orgchat.dto.MessageRequest;
import com.orgchat.dto.MessageResponse;
import com.orgchat.model.Message;
import com.orgchat.model.User;
import com.orgchat.repository.MessageRepository;
import com.orgchat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
public class MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(MessageRepository messageRepository,
                          UserRepository userRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public MessageResponse sendMessage(String senderMerID, MessageRequest request) {
        log.info("Sending message from '{}' to '{}'", senderMerID, request.getRecipientId());

        if (request.getRecipientId() == null || request.getRecipientId().isBlank()) {
            log.error("Message send failed — recipientId is blank, from: {}", senderMerID);
            throw new IllegalArgumentException("Recipient ID cannot be empty");
        }

        Message message = Message.builder()
                .senderId(senderMerID)
                .recipientId(request.getRecipientId())
                .content(request.getContent())
                .mediaId(request.getMediaId())
                .timestamp(Instant.now())
                .read(false)
                .build();

        Message saved = messageRepository.save(message);
        log.info("Message saved with id: {} (from: {} -> to: {})", saved.getId(), senderMerID, request.getRecipientId());

        if (request.getMediaId() != null) {
            log.debug("Message includes media attachment: {}", request.getMediaId());
        }

        MessageResponse response = toResponse(saved);

        // Real-time delivery via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    request.getRecipientId(),
                    "/queue/messages",
                    response);
            log.debug("WebSocket message delivered to user: {}", request.getRecipientId());
        } catch (Exception e) {
            log.error("WebSocket delivery failed for user '{}': {}", request.getRecipientId(), e.getMessage(), e);
        }

        return response;
    }

    public Optional<MessageResponse> findById(String id) {
        log.debug("Fetching message by id: {}", id);
        Optional<MessageResponse> result = messageRepository.findById(id).map(this::toResponse);
        if (result.isEmpty()) {
            log.warn("Message not found: {}", id);
        }
        return result;
    }

    public Page<MessageResponse> getConversation(String userA, String userB, int page, int size) {
        log.info("Fetching conversation between '{}' and '{}' (page: {}, size: {})", userA, userB, page, size);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<MessageResponse> conversation = messageRepository.findConversation(userA, userB, pageRequest)
                .map(this::toResponse);
        log.debug("Conversation returned {} messages (total: {})", conversation.getNumberOfElements(), conversation.getTotalElements());
        return conversation;
    }

    public long getUnreadCount(String merID) {
        long count = messageRepository.countByRecipientIdAndReadFalse(merID);
        log.debug("Unread count for '{}': {}", merID, count);
        return count;
    }

    private MessageResponse toResponse(Message message) {
        String senderName = userRepository.findByMerID(message.getSenderId())
                .map(User::getDisplayName)
                .orElse(message.getSenderId());

        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .senderName(senderName)
                .recipientId(message.getRecipientId())
                .content(message.getContent())
                .mediaId(message.getMediaId())
                .timestamp(message.getTimestamp())
                .read(message.isRead())
                .build();
    }
}
