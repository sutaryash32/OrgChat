package com.orgchat.controller;

import com.orgchat.dto.MessageRequest;
import com.orgchat.dto.MessageResponse;
import com.orgchat.dto.MultiMessageRequest;
import com.orgchat.service.MessageService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
            @AuthenticationPrincipal String merID,
            @Valid @RequestBody MessageRequest request) {
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

    @PostMapping("/send-multi")
    public ResponseEntity<List<MessageResponse>> sendToMultiple(
            @AuthenticationPrincipal String merID,
            @Valid @RequestBody MultiMessageRequest request) {
        log.info("POST /api/messages/send-multi — from: '{}' to {} recipients", merID, request.getRecipientIds().size());
        try {
            List<MessageResponse> responses = messageService.sendToMultiple(merID, request);
            log.info("Multi-message sent successfully — sent to {} recipients", responses.size());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Multi-message send failed from '{}': {}", merID, e.getMessage(), e);
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
            @AuthenticationPrincipal String merID,
            @RequestParam String withUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("GET /api/messages/conversation — '{}' with '{}' (page: {}, size: {})",
                merID, withUser, page, size);
        return ResponseEntity.ok(
                messageService.getConversation(merID, withUser, page, size));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal String merID) {
        log.debug("GET /api/messages/unread/count for '{}'", merID);
        return ResponseEntity.ok(messageService.getUnreadCount(merID));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editMessage(
            @PathVariable String id,
            @AuthenticationPrincipal String merID,
            @RequestBody Map<String, String> request) {
        log.info("PUT /api/messages/{} — from: '{}'", id, merID);
        try {
            String newContent = request.get("content");
            if (newContent == null || newContent.isBlank()) {
                return ResponseEntity.badRequest().body("Content cannot be empty");
            }
            MessageResponse response = messageService.editMessage(id, merID, newContent);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Edit failed for message '{}': {}", id, e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Edit failed for message '{}': {}", id, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(
            @PathVariable String id,
            @AuthenticationPrincipal String merID) {
        log.info("DELETE /api/messages/{} — from: '{}'", id, merID);
        try {
            messageService.deleteMessage(id, merID);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Delete failed for message '{}': {}", id, e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Delete failed for message '{}': {}", id, e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
}
