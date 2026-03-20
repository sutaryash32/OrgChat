package com.orgchat.controller;

import com.orgchat.model.User;
import com.orgchat.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<User> getUserByMerID(@PathVariable String id) {
        log.info("GET /api/users/{} — fetching user profile", id);
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
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("GET /api/users — fetching all users");
        List<User> users = userService.findAll();
        users.forEach(u -> u.setPasswordHash(null));
        log.info("Returning {} users", users.size());
        return ResponseEntity.ok(users);
    }
}
