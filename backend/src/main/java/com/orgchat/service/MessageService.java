package com.orgchat.service;

import com.orgchat.dto.MessageRequest;
import com.orgchat.dto.MessageResponse;
import com.orgchat.model.Message;
import com.orgchat.model.User;
import com.orgchat.repository.MessageRepository;
import com.orgchat.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
public class MessageService {

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
        Message message = Message.builder()
                .senderId(senderMerID)
                .recipientId(request.getRecipientId())
                .content(request.getContent())
                .mediaId(request.getMediaId())
                .timestamp(Instant.now())
                .read(false)
                .build();

        Message saved = messageRepository.save(message);

        MessageResponse response = toResponse(saved);

        // Real-time delivery via WebSocket
        messagingTemplate.convertAndSendToUser(
                request.getRecipientId(),
                "/queue/messages",
                response);

        return response;
    }

    public Optional<MessageResponse> findById(String id) {
        return messageRepository.findById(id).map(this::toResponse);
    }

    public Page<MessageResponse> getConversation(String userA, String userB, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return messageRepository.findConversation(userA, userB, pageRequest)
                .map(this::toResponse);
    }

    public long getUnreadCount(String merID) {
        return messageRepository.countByRecipientIdAndReadFalse(merID);
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
