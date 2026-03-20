package com.orgchat.controller;

import com.orgchat.dto.UserSummaryDto;
import com.orgchat.model.User;
import com.orgchat.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserByMerID(@PathVariable String id, Principal principal) {
        log.info("GET /api/users/{} — fetching user profile", id);

        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        String requesterMerID = principal.getName();
        boolean isSelf = requesterMerID.equals(id);
        boolean isAdmin = userService.findByMerID(requesterMerID)
                .map(user -> "ADMIN".equalsIgnoreCase(user.getRole()))
                .orElse(false);

        if (!isSelf && !isAdmin) {
            log.warn("Forbidden user profile access attempt by '{}' for '{}'", requesterMerID, id);
            return ResponseEntity.status(403).build();
        }

        return userService.findByMerID(id)
                .map(user -> {
                    user.setPasswordHash(null);
                    log.info("User profile found: {} ({})", user.getDisplayName(), id);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> {
                    log.warn("User profile not found: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryDto>> getAllUsers() {
        log.info("GET /api/users — fetching all users");
        List<UserSummaryDto> users = userService.findAllSummaries();
        log.info("Returning {} users", users.size());
        return ResponseEntity.ok(users);
    }
}
