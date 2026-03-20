package com.orgchat.service;

import com.orgchat.dto.AuthResponse;
import com.orgchat.model.Session;
import com.orgchat.model.User;
import com.orgchat.repository.SessionRepository;
import com.orgchat.repository.UserRepository;
import com.orgchat.security.JwtUtil;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuthService {

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
        if (!jwtUtil.isTokenValid(expiredToken)) {
            // Try to extract merID even from expired token for refresh flow
            String merID;
            try {
                merID = jwtUtil.extractMerID(expiredToken);
            } catch (Exception e) {
                throw new RuntimeException("Invalid token — cannot refresh");
            }

            User user = userRepository.findByMerID(merID)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return issueTokens(user);
        }

        String merID = jwtUtil.extractMerID(expiredToken);
        User user = userRepository.findByMerID(merID)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return issueTokens(user);
    }

    public AuthResponse issueTokens(User user) {
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
        sessionRepository.deleteByUserId(merID);
    }
}
