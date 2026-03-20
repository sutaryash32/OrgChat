package com.orgchat.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    private final SecretKey key;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        log.info("JwtUtil initialized");
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
        try {
            String merID = getClaims(token).getSubject();
            log.debug("Extracted merID from token: '{}'", merID);
            return merID;
        } catch (ExpiredJwtException e) {
            log.warn("Token expired, extracting merID from expired claims");
            return e.getClaims().getSubject();
        } catch (Exception e) {
            log.error("Failed to extract merID from token: {}", e.getMessage());
            throw e;
        }
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            log.debug("JWT validated successfully");
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired at: {}", e.getClaims().getExpiration());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Malformed JWT: {}", e.getMessage());
        } catch (SecurityException e) {
            log.error("JWT signature validation failed: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
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
