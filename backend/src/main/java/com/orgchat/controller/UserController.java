package com.orgchat.controller;


import com.orgchat.dto.UserSummaryDTO;
import com.orgchat.model.User;
import com.orgchat.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<User> getUserByMerID(@PathVariable String id,
                                               @AuthenticationPrincipal String currentMerID) {
        log.info("GET /api/users/{} — fetching user profile", id);

        if (currentMerID == null) {
            return ResponseEntity.status(401).build();
        }

        boolean isSelf = currentMerID.equals(id);
        boolean isAdmin = userService.findByMerID(currentMerID)
                .map(user -> "ADMIN".equalsIgnoreCase(user.getRole()))
                .orElse(false);

        if (!isSelf && !isAdmin) {
            log.warn("Forbidden user profile access attempt by '{}' for '{}'", currentMerID, id);
            return ResponseEntity.status(403).build();
        }

        return userService.findByMerID(id)
                .map(user -> {
                    log.info("User profile found: {} ({})", user.getDisplayName(), id);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> {
                    log.warn("User profile not found: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        log.info("GET /api/users — fetching all users");
        List<UserSummaryDTO> users = userService.findAllSummaries();
        log.info("Returning {} users", users.size());
        return ResponseEntity.ok(users);
    }
}
