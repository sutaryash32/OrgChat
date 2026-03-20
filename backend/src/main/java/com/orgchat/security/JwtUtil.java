package com.orgchat.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    private final String secret;
    private SecretKey key;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret) {
        this.secret = secret;
    }

    @PostConstruct
    public void validateSecretStrength() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET is required. Set environment variable JWT_SECRET with at least 32 characters.");
        }

        if (secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters.");
        }

        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        log.info("JwtUtil initialized");
    }

    @PostConstruct
    public void validateSecretStrength() {
        // HS256 requires at least 256-bit key material.
        int keyLength = key.getEncoded().length;
        if (keyLength < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
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
            log.debug("Extracted merID from expired token claims: '{}'", merID);
            return merID;
        }
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            log.debug("JWT validated successfully");
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired at: {}", e.getClaims().getExpiration());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            throw e;
        }
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
}
