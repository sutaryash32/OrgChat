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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

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

        Map<String, String> senderDisplayNames = resolveDisplayNames(Set.of(saved.getSenderId()));
        MessageResponse response = toResponse(saved, senderDisplayNames);

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
        Optional<MessageResponse> result = messageRepository.findById(id)
                .map(message -> toResponse(message, resolveDisplayNames(Set.of(message.getSenderId()))));
        if (result.isEmpty()) {
            log.warn("Message not found: {}", id);
        }
        return result;
    }

    public Page<MessageResponse> getConversation(String userA, String userB, int page, int size) {
        log.info("Fetching conversation between '{}' and '{}' (page: {}, size: {})", userA, userB, page, size);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "timestamp"));
        var messagePage = messageRepository.findConversation(userA, userB, pageRequest);

        Set<String> senderIds = messagePage.getContent().stream()
            .map(Message::getSenderId)
            .collect(Collectors.toSet());
        Map<String, String> senderDisplayNames = resolveDisplayNames(senderIds);

        Page<MessageResponse> conversation = messagePage.map(message -> toResponse(message, senderDisplayNames));
        log.debug("Conversation returned {} messages (total: {})", conversation.getNumberOfElements(), conversation.getTotalElements());
        return conversation;
    }

    public long getUnreadCount(String merID) {
        long count = messageRepository.countByRecipientIdAndReadFalse(merID);
        log.debug("Unread count for '{}': {}", merID, count);
        return count;
    }

    private Map<String, String> resolveDisplayNames(Set<String> senderIds) {
        if (senderIds.isEmpty()) {
            return Map.of();
        }

        List<User> users = userRepository.findAllByMerIDIn(senderIds.stream().toList());
        return users.stream().collect(Collectors.toMap(
                User::getMerID,
                user -> (user.getDisplayName() == null || user.getDisplayName().isBlank())
                        ? user.getMerID()
                        : user.getDisplayName(),
                (left, right) -> left
        ));
    }

    private MessageResponse toResponse(Message message, Map<String, String> senderDisplayNames) {
        String senderName = senderDisplayNames.getOrDefault(message.getSenderId(), message.getSenderId());

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

    public MessageResponse editMessage(String messageId, String requesterMerID, String newContent) {
        log.info("Editing message '{}' by '{}'", messageId, requesterMerID);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> {
                    log.error("Message not found: {}", messageId);
                    return new RuntimeException("Message not found");
                });

        if (!message.getSenderId().equals(requesterMerID)) {
            log.error("Unauthorized edit attempt: requester '{}' is not sender '{}'", requesterMerID, message.getSenderId());
            throw new IllegalArgumentException("Only the original sender can edit this message");
        }

        message.setContent(newContent);
        message.setEdited(true);
        Message updated = messageRepository.save(message);
        log.info("Message '{}' edited successfully", messageId);

        Map<String, String> senderDisplayNames = resolveDisplayNames(Set.of(updated.getSenderId()));
        MessageResponse response = toResponse(updated, senderDisplayNames);
        response.setAction("EDIT");

        // Broadcast edit to both sender and recipient
        try {
            messagingTemplate.convertAndSendToUser(
                    message.getRecipientId(),
                    "/queue/messages",
                    response);
            log.debug("Edit broadcast to recipient: {}", message.getRecipientId());
        } catch (Exception e) {
            log.error("WebSocket delivery failed for user '{}': {}", message.getRecipientId(), e.getMessage(), e);
        }

        return response;
    }

    public void deleteMessage(String messageId, String requesterMerID) {
        log.info("Deleting message '{}' by '{}'", messageId, requesterMerID);

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> {
                    log.error("Message not found: {}", messageId);
                    return new RuntimeException("Message not found");
                });

        if (!message.getSenderId().equals(requesterMerID)) {
            log.error("Unauthorized delete attempt: requester '{}' is not sender '{}'", requesterMerID, message.getSenderId());
            throw new IllegalArgumentException("Only the original sender can delete this message");
        }

        messageRepository.deleteById(messageId);
        log.info("Message '{}' deleted successfully", messageId);

        // Broadcast delete to both sender and recipient
        MessageResponse response = MessageResponse.builder()
                .id(messageId)
                .action("DELETE")
                .build();

        try {
            messagingTemplate.convertAndSendToUser(
                    message.getRecipientId(),
                    "/queue/messages",
                    response);
            log.debug("Delete broadcast to recipient: {}", message.getRecipientId());
        } catch (Exception e) {
            log.error("WebSocket delivery failed for user '{}': {}", message.getRecipientId(), e.getMessage(), e);
        }
    }
}
