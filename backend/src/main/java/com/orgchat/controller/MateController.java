package com.orgchat.controller;

import com.orgchat.model.MateRequest;
import com.orgchat.model.User;
import com.orgchat.service.MateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mates")
public class MateController {

    private static final Logger log = LoggerFactory.getLogger(MateController.class);

    private final MateService mateService;

    public MateController(MateService mateService) {
        this.mateService = mateService;
    }

    /** Search for a user by merID */
    @GetMapping("/search")
    public ResponseEntity<User> searchUser(@RequestParam String merID) {
        log.info("GET /api/mates/search?merID={}", merID);
        return mateService.searchUser(merID)
                .map(user -> {
                    user.setPasswordHash(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Send a mate request */
    @PostMapping("/request")
    public ResponseEntity<MateRequest> sendRequest(
            Principal principal,
            @RequestBody Map<String, String> body) {
        String fromMerID = principal.getName();
        String toMerID = body.get("toMerID");
        log.info("POST /api/mates/request — from: '{}' to: '{}'", fromMerID, toMerID);
        MateRequest request = mateService.sendRequest(fromMerID, toMerID);
        return ResponseEntity.ok(request);
    }

    /** Accept a mate request */
    @PutMapping("/accept/{requestId}")
    public ResponseEntity<MateRequest> acceptRequest(
            Principal principal,
            @PathVariable String requestId) {
        log.info("PUT /api/mates/accept/{} by '{}'", requestId, principal.getName());
        MateRequest accepted = mateService.acceptRequest(requestId, principal.getName());
        return ResponseEntity.ok(accepted);
    }

    /** Reject a mate request */
    @PutMapping("/reject/{requestId}")
    public ResponseEntity<MateRequest> rejectRequest(
            Principal principal,
            @PathVariable String requestId) {
        log.info("PUT /api/mates/reject/{} by '{}'", requestId, principal.getName());
        MateRequest rejected = mateService.rejectRequest(requestId, principal.getName());
        return ResponseEntity.ok(rejected);
    }

    /** Get incoming pending requests */
    @GetMapping("/pending")
    public ResponseEntity<List<MateRequest>> getPendingRequests(Principal principal) {
        String merID = principal.getName();
        log.info("GET /api/mates/pending for '{}'", merID);
        return ResponseEntity.ok(mateService.getPendingRequests(merID));
    }

    /** Get sent pending requests */
    @GetMapping("/sent")
    public ResponseEntity<List<MateRequest>> getSentRequests(Principal principal) {
        String merID = principal.getName();
        log.info("GET /api/mates/sent for '{}'", merID);
        return ResponseEntity.ok(mateService.getSentRequests(merID));
    }

    /** Get all accepted mates (User objects) */
    @GetMapping("/list")
    public ResponseEntity<List<User>> getMates(Principal principal) {
        String merID = principal.getName();
        log.info("GET /api/mates/list for '{}'", merID);
        List<User> mates = mateService.getMates(merID);
        mates.forEach(u -> u.setPasswordHash(null));
        return ResponseEntity.ok(mates);
    }
}
