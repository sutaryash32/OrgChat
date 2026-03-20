package com.orgchat.controller;

import com.orgchat.dto.AuthResponse;
import com.orgchat.model.User;
import com.orgchat.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * SSO login is handled by Spring Security OAuth2 flow.
     * This endpoint initiates the redirect to Google.
     */
    @PostMapping("/sso/login")
    public ResponseEntity<Map<String, String>> ssoLogin() {
        return ResponseEntity.ok(Map.of(
                "redirectUrl", "/oauth2/authorization/google"
        ));
    }

    /**
     * Refresh an expired JWT token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthResponse response = authService.refreshToken(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Logout — invalidate session.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal User user) {
        if (user != null) {
            authService.logout(user.getMerID());
        }
        return ResponseEntity.ok().build();
    }
}
