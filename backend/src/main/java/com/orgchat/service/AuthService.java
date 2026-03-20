package com.orgchat.service;

import com.orgchat.dto.AuthResponse;
import com.orgchat.model.Session;
import com.orgchat.model.User;
import com.orgchat.repository.SessionRepository;
import com.orgchat.repository.UserRepository;
import com.orgchat.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       SessionRepository sessionRepository,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse refreshToken(String expiredToken) {
        log.info("Token refresh requested");

        String merID;
        try {
            merID = jwtUtil.extractMerID(expiredToken);
            log.debug("Extracted merID from token: {}", merID);
        } catch (Exception e) {
            log.error("Failed to extract merID from token for refresh: {}", e.getMessage());
            throw new RuntimeException("Invalid token — cannot refresh");
        }

        User user = userRepository.findByMerID(merID)
                .orElseThrow(() -> {
                    log.error("Token refresh failed — user not found: {}", merID);
                    return new RuntimeException("User not found for merID: " + merID);
                });

        log.info("Token refreshed successfully for user: {}", merID);
        return issueTokens(user);
    }

    public AuthResponse issueTokens(User user) {
        log.info("Issuing new tokens for user: {} ({})", user.getMerID(), user.getEmail());

        String token = jwtUtil.generateToken(user.getMerID(), user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getMerID(), user.getEmail());

        // Persist session
        sessionRepository.deleteByUserId(user.getMerID());
        Session session = Session.builder()
                .userId(user.getMerID())
                .jwtToken(token)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(jwtUtil.getExpirationMs()))
                .build();
        sessionRepository.save(session);

        log.debug("Session persisted for user: {}, expires at: {}", user.getMerID(), session.getExpiresAt());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .merID(user.getMerID())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .expiresIn(jwtUtil.getExpirationMs())
                .build();
    }

    public void logout(String merID) {
        log.info("Logout requested for user: {}", merID);
        sessionRepository.deleteByUserId(merID);
        log.info("Session deleted for user: {}", merID);
    }
}
