package com.orgchat.security;

import com.orgchat.model.User;
import com.orgchat.repository.UserRepository;
import com.orgchat.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    private final UserRepository userRepository;
    private final AuthService authService;

    @Value("${app.frontend.redirect-url}")
    private String frontendRedirectUrl;

    public OAuth2SuccessHandler(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        log.info("=== OAuth2 Login Success ===");
        log.info("Email: {}", email);
        log.info("Name:  {}", name);

        if (email == null || email.isBlank()) {
            log.error("OAuth2 login failed — email attribute is null or blank. Attributes: {}", oAuth2User.getAttributes());
            response.sendRedirect(frontendRedirectUrl.replace("/chat", "/login?error=no_email"));
            return;
        }

        // Derive merID from email
        String merID = email.split("@")[0];
        log.info("Derived merID: '{}'", merID);

        // Upsert user
        Optional<User> existing = userRepository.findByEmail(email);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            user.setDisplayName(name);
            log.info("Existing user found — updating display name for: {}", merID);
        } else {
            user = User.builder()
                    .merID(merID)
                    .email(email)
                    .displayName(name)
                    .ssoProvider("google")
                    .role("USER")
                    .createdAt(Instant.now())
                    .build();
            log.info("New user created — merID: '{}', email: '{}'", merID, email);
        }
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        log.info("User saved to database: {}", merID);

        // Issue tokens
        var authResponse = authService.issueTokens(user);
        log.info("Tokens issued for user: {}", merID);

        // Redirect to frontend with token
        String redirectUrl = frontendRedirectUrl + "?token=" + authResponse.getToken() + "&merID=" + merID;
        log.info("Redirecting to frontend: {}", frontendRedirectUrl + "?token=***&merID=" + merID);
        response.sendRedirect(redirectUrl);
    }
}
