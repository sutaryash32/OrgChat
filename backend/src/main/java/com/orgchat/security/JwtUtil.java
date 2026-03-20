package com.orgchat.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    private final String configuredSecret;
    private SecretKey key;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    public JwtUtil(@Value("${app.jwt.secret:}") String secret) {
        this.configuredSecret = secret;
    }

    @PostConstruct
    public void init() {
        String secret = configuredSecret;

        if (secret == null || secret.isBlank()) {
            // Prototype mode — generate a random secret, invalidated on restart
            byte[] bytes = new byte[64];
            new SecureRandom().nextBytes(bytes);
            secret = Base64.getEncoder().encodeToString(bytes);
            log.warn("JWT_SECRET not set — generated a random secret for this session. " +
                    "All tokens will be invalidated on restart. Set JWT_SECRET in production.");
        } else if (secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters.");
        } else {
            log.info("JwtUtil initialized with configured secret.");
        }

        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String merID, String email) {
        String token = Jwts.builder()
                .claim("email", email)
                .subject(merID)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
        log.info("JWT generated for merID: '{}', expires in: {}ms", merID, expirationMs);
        return token;
    }

    public String generateRefreshToken(String merID, String email) {
        String token = Jwts.builder()
                .claim("email", email)
                .subject(merID)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(key)
                .compact();
        log.debug("Refresh token generated for merID: '{}'", merID);
        return token;
    }

    public String extractMerID(String token) {
        String merID = getClaims(token).getSubject();
        log.debug("Extracted merID from token: '{}'", merID);
        return merID;
    }

    public String extractMerIDIgnoringExpiry(String token) {
        try {
            return extractMerID(token);
        } catch (ExpiredJwtException e) {
            String merID = e.getClaims().getSubject();
            log.debug("Extracted merID from expired token: '{}'", merID);
            return merID;
        }
    }

    // Fix #8: Returns enum so callers can distinguish expired vs tampered
    public TokenValidationResult validateToken(String token) {
        try {
            getClaims(token);
            return TokenValidationResult.VALID;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired at: {}", e.getClaims().getExpiration());
            return TokenValidationResult.EXPIRED;
        } catch (SignatureException | MalformedJwtException e) {
            log.warn("JWT tampered or malformed from token — rejecting: {}", e.getMessage());
            return TokenValidationResult.TAMPERED;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return TokenValidationResult.INVALID;
        }
    }

    // Convenience wrapper for places that just need a boolean
    public boolean isTokenValid(String token) {
        return validateToken(token) == TokenValidationResult.VALID;
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public enum TokenValidationResult {
        VALID, EXPIRED, TAMPERED, INVALID
    }
}