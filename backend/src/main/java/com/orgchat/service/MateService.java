package com.orgchat.service;

import com.orgchat.model.MateRequest;
import com.orgchat.model.User;
import com.orgchat.repository.MateRequestRepository;
import com.orgchat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MateService {

    private static final Logger log = LoggerFactory.getLogger(MateService.class);

    private final MateRequestRepository mateRequestRepository;
    private final UserRepository userRepository;

    public MateService(MateRequestRepository mateRequestRepository, UserRepository userRepository) {
        this.mateRequestRepository = mateRequestRepository;
        this.userRepository = userRepository;
    }

    /**
     * Search for a user by merID.
     */
    public Optional<User> searchUser(String merID) {
        log.info("Searching for user by merID: '{}'", merID);
        return userRepository.findByMerID(merID);
    }

    /**
     * Send a mate request from one user to another.
     */
    public MateRequest sendRequest(String fromMerID, String toMerID) {
        log.info("Mate request: '{}' → '{}'", fromMerID, toMerID);

        if (fromMerID.equals(toMerID)) {
            log.warn("Cannot send mate request to yourself: {}", fromMerID);
            throw new IllegalArgumentException("Cannot send a mate request to yourself");
        }

        // Check if user exists
        userRepository.findByMerID(toMerID).orElseThrow(() -> {
            log.warn("Mate request failed — user not found: {}", toMerID);
            return new IllegalArgumentException("User not found: " + toMerID);
        });

        // Check if a request already exists between these two users
        Optional<MateRequest> existing = mateRequestRepository.findBetween(fromMerID, toMerID);
        if (existing.isPresent()) {
            MateRequest req = existing.get();
            if ("ACCEPTED".equals(req.getStatus())) {
                log.info("Already mates: '{}' and '{}'", fromMerID, toMerID);
                throw new IllegalArgumentException("You are already mates with " + toMerID);
            }
            if ("PENDING".equals(req.getStatus())) {
                log.info("Pending request already exists between '{}' and '{}'", fromMerID, toMerID);
                throw new IllegalArgumentException("A mate request is already pending with " + toMerID);
            }
            // If REJECTED, allow re-sending — delete old and create new
            log.info("Previous request was rejected, allowing resend");
            mateRequestRepository.delete(req);
        }

        MateRequest request = MateRequest.builder()
                .fromMerID(fromMerID)
                .toMerID(toMerID)
                .status("PENDING")
                .createdAt(Instant.now())
                .build();

        MateRequest saved = mateRequestRepository.save(request);
        log.info("Mate request sent — id: {}, from: '{}', to: '{}'", saved.getId(), fromMerID, toMerID);
        return saved;
    }

    /**
     * Accept a mate request.
     */
    public MateRequest acceptRequest(String requestId, String currentMerID) {
        log.info("Accepting mate request: {} by '{}'", requestId, currentMerID);

        MateRequest request = mateRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getToMerID().equals(currentMerID)) {
            log.warn("Accept denied — '{}' is not the recipient of request {}", currentMerID, requestId);
            throw new SecurityException("Only the recipient can accept a mate request");
        }

        request.setStatus("ACCEPTED");
        request.setUpdatedAt(Instant.now());
        MateRequest saved = mateRequestRepository.save(request);
        log.info("Mate request accepted — '{}' and '{}' are now mates", request.getFromMerID(), request.getToMerID());
        return saved;
    }

    /**
     * Reject a mate request.
     */
    public MateRequest rejectRequest(String requestId, String currentMerID) {
        log.info("Rejecting mate request: {} by '{}'", requestId, currentMerID);

        MateRequest request = mateRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getToMerID().equals(currentMerID)) {
            log.warn("Reject denied — '{}' is not the recipient of request {}", currentMerID, requestId);
            throw new SecurityException("Only the recipient can reject a mate request");
        }

        request.setStatus("REJECTED");
        request.setUpdatedAt(Instant.now());
        MateRequest saved = mateRequestRepository.save(request);
        log.info("Mate request rejected — id: {}", requestId);
        return saved;
    }

    /**
     * Get pending requests for a user (incoming).
     */
    public List<MateRequest> getPendingRequests(String merID) {
        log.debug("Getting pending requests for: '{}'", merID);
        List<MateRequest> requests = mateRequestRepository.findByToMerIDAndStatus(merID, "PENDING");
        log.debug("Found {} pending requests for '{}'", requests.size(), merID);
        return requests;
    }

    /**
     * Get sent requests (outgoing).
     */
    public List<MateRequest> getSentRequests(String merID) {
        log.debug("Getting sent requests for: '{}'", merID);
        return mateRequestRepository.findByFromMerIDAndStatus(merID, "PENDING");
    }

    /**
     * Get all accepted mates (User objects) for a user.
     */
    public List<User> getMates(String merID) {
        log.info("Getting mates list for: '{}'", merID);

        List<MateRequest> accepted = mateRequestRepository.findAcceptedMates(merID);
        List<String> mateMerIDs = accepted.stream()
                .map(req -> req.getFromMerID().equals(merID) ? req.getToMerID() : req.getFromMerID())
                .distinct()
                .collect(Collectors.toList());

        List<User> mates = new ArrayList<>();
        for (String mateMerID : mateMerIDs) {
            userRepository.findByMerID(mateMerID).ifPresent(mates::add);
        }

        log.info("Found {} mates for '{}'", mates.size(), merID);
        return mates;
    }
}
