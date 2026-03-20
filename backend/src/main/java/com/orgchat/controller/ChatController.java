package com.orgchat.controller;

import com.orgchat.dto.MessageRequest;
import com.orgchat.dto.MessageResponse;
import com.orgchat.model.User;
import com.orgchat.service.ChatService;
import com.orgchat.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * ChatController handles all chat initiation and messaging operations.
 * All routes operate with merID as the unique user identifier.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    /**
     * Start a chat session with another user by their merID.
     * Validates that both users exist and resolves recipient profile.
     *
     * @param principal authenticated user (merID)
     * @param recipientMerID target user's merID
     * @return recipient User profile
     */
    @PostMapping("/start/{recipientMerID}")
    public ResponseEntity<User> startChat(
            Principal principal,
            @PathVariable String recipientMerID) {
        String senderMerID = principal.getName();
        log.info("POST /api/chat/start/{} — initiated by '{}'", recipientMerID, senderMerID);

        // Validate recipient exists
        User recipient = userService.findByMerID(recipientMerID)
                .orElseThrow(() -> {
                    log.warn("Chat start failed — recipient not found: {}", recipientMerID);
                    return new IllegalArgumentException("User not found: " + recipientMerID);
                });

        // Sanitize sensitive data
        recipient.setPasswordHash(null);

        log.info("Chat session started between '{}' and '{}'", senderMerID, recipientMerID);
        return ResponseEntity.ok(recipient);
    }

    /**
     * Send a message to another user by merID.
     * Messages are keyed by senderMerID → recipientMerID.
     *
     * @param principal authenticated user (merID)
     * @param request message content and recipient
     * @return sent MessageResponse
     */
    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(
            Principal principal,
            @RequestBody MessageRequest request) {
        String senderMerID = principal.getName();
        log.info("POST /api/chat/send — from: '{}' to: '{}'", senderMerID, request.getRecipientId());

        try {
            MessageResponse response = chatService.sendMessage(senderMerID, request);
            log.info("Message sent successfully — id: {}", response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Message send failed from '{}': {}", senderMerID, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Retrieve conversation history between two users.
     * Results are filtered by senderMerID and recipientMerID.
     *
     * @param principal authenticated user (merID)
     * @param withMerID target user's merID
     * @param page pagination page number
     * @param size page size
     * @return paginated conversation messages
     */
    @GetMapping("/conversation/{withMerID}")
    public ResponseEntity<Page<MessageResponse>> getConversation(
            Principal principal,
            @PathVariable String withMerID,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        String senderMerID = principal.getName();
        log.info("GET /api/chat/conversation/{} — '{}' (page: {}, size: {})",
                withMerID, senderMerID, page, size);

        try {
            Page<MessageResponse> conversation = chatService.getConversation(senderMerID, withMerID, page, size);
            log.debug("Conversation returned {} messages", conversation.getNumberOfElements());
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            log.error("Failed to retrieve conversation between '{}' and '{}': {}",
                    senderMerID, withMerID, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get unread message count for authenticated user.
     *
     * @param principal authenticated user (merID)
     * @return count of unread messages
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        String merID = principal.getName();
        log.debug("GET /api/chat/unread/count for '{}'", merID);
        long count = chatService.getUnreadCount(merID);
        return ResponseEntity.ok(count);
    }
}
