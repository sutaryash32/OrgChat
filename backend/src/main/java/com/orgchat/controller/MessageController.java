package com.orgchat.controller;

import com.orgchat.dto.MessageRequest;
import com.orgchat.dto.MessageResponse;
import com.orgchat.service.MessageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private static final Logger log = LoggerFactory.getLogger(MessageController.class);

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(
            Principal principal,
            @Valid @RequestBody MessageRequest request) {
        String merID = principal.getName();
        log.info("POST /api/messages/send — from: '{}' to: '{}'", merID, request.getRecipientId());
        try {
            MessageResponse response = messageService.sendMessage(merID, request);
            log.info("Message sent successfully — id: {}", response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Message send failed from '{}': {}", merID, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageResponse> getMessageById(@PathVariable String id) {
        log.debug("GET /api/messages/{}", id);
        return messageService.findById(id)
                .map(msg -> {
                    log.debug("Message found: {}", id);
                    return ResponseEntity.ok(msg);
                })
                .orElseGet(() -> {
                    log.warn("Message not found: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/conversation")
    public ResponseEntity<Page<MessageResponse>> getConversation(
            Principal principal,
            @RequestParam String withUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        String merID = principal.getName();
        log.info("GET /api/messages/conversation — '{}' with '{}' (page: {}, size: {})",
                merID, withUser, page, size);
        return ResponseEntity.ok(
                messageService.getConversation(merID, withUser, page, size));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        String merID = principal.getName();
        log.debug("GET /api/messages/unread/count for '{}'", merID);
        return ResponseEntity.ok(messageService.getUnreadCount(merID));
    }
}
