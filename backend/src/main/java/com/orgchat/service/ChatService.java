package com.orgchat.service;

import com.orgchat.dto.MessageRequest;
import com.orgchat.dto.MessageResponse;
import com.orgchat.model.Message;
import com.orgchat.repository.MessageRepository;
import com.orgchat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ChatService handles all chat operations keyed by merID.
 * Delegates core messaging to MessageService where appropriate.
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final MessageService messageService;

    public ChatService(MessageRepository messageRepository,
                       UserRepository userRepository,
                       MessageService messageService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.messageService = messageService;
    }

    /**
     * Send a message from one user (merID) to another.
     * Delegates to MessageService for core logic.
     *
     * @param senderMerID sender's merID
     * @param request message details (recipientId, content, mediaId)
     * @return MessageResponse
     */
    public MessageResponse sendMessage(String senderMerID, MessageRequest request) {
        log.info("Chat.sendMessage — from: '{}' to: '{}'", senderMerID, request.getRecipientId());
        return messageService.sendMessage(senderMerID, request);
    }

    /**
    * Retrieve conversation between two users, ordered by timestamp (oldest first).
     * Filters messages where senderMerID and recipientMerID match (bidirectional).
     *
     * @param userAMerID first user's merID
     * @param userBMerID second user's merID
     * @param page page number (0-indexed)
     * @param size page size
     * @return paginated conversation
     */
    public Page<MessageResponse> getConversation(String userAMerID, String userBMerID, int page, int size) {
        log.info("Chat.getConversation — between '{}' and '{}' (page: {}, size: {})",
                userAMerID, userBMerID, page, size);

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "timestamp"));
        var messagePage = messageRepository.findConversation(userAMerID, userBMerID, pageRequest);

        Set<String> senderIds = messagePage.getContent().stream()
            .map(Message::getSenderId)
            .collect(Collectors.toSet());
        Map<String, String> displayNames = resolveDisplayNames(senderIds);

        Page<MessageResponse> conversation = messagePage.map(message -> toResponse(message, displayNames));

        log.debug("Conversation returned {} messages (total: {})",
                conversation.getNumberOfElements(), conversation.getTotalElements());
        return conversation;
    }

    /**
     * Get count of unread messages for a user (recipient).
     * Unread = messages where recipientId matches and read = false.
     *
     * @param merID user's merID
     * @return unread message count
     */
    public long getUnreadCount(String merID) {
        long count = messageRepository.countByRecipientIdAndReadFalse(merID);
        log.debug("Unread count for '{}': {}", merID, count);
        return count;
    }

    /**
     * Helper: Convert Message entity to MessageResponse DTO with sender name resolved.
     */
    private Map<String, String> resolveDisplayNames(Set<String> senderIds) {
        if (senderIds.isEmpty()) {
            return Map.of();
        }

        List<String> ids = senderIds.stream().toList();
        return userRepository.findAllByMerIDIn(ids).stream().collect(Collectors.toMap(
                u -> u.getMerID(),
                u -> (u.getDisplayName() == null || u.getDisplayName().isBlank()) ? u.getMerID() : u.getDisplayName(),
                (left, right) -> left
        ));
    }

    private MessageResponse toResponse(Message message, Map<String, String> displayNames) {
        String senderName = displayNames.getOrDefault(message.getSenderId(), message.getSenderId());

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
