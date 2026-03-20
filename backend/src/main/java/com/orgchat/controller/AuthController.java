package com.orgchat.controller;

import com.orgchat.dto.AuthResponse;
import com.orgchat.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/sso/login")
    public ResponseEntity<Map<String, String>> ssoLogin() {
        log.info("SSO login initiated — redirecting to Google OAuth2");
        return ResponseEntity.ok(Map.of(
                "redirectUrl", "/oauth2/authorization/google"
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            log.warn("Token refresh failed — no token provided in request body");
            return ResponseEntity.badRequest().build();
        }
        log.info("Token refresh request received");
        try {
            AuthResponse response = authService.refreshToken(token);
            log.info("Token refresh successful for merID: {}", response.getMerID());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Principal principal) {
        if (principal != null) {
            String merID = principal.getName();
            log.info("Logout request from user: {}", merID);
            authService.logout(merID);
        } else {
            log.warn("Logout request with no authenticated user");
        }
        return ResponseEntity.ok().build();
    }
}
