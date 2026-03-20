package com.orgchat.security;

import com.orgchat.model.User;
import com.orgchat.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final String frontendRedirectUrl;

    public OAuth2SuccessHandler(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            @Value("${app.frontend.redirect-url}") String frontendRedirectUrl) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.frontendRedirectUrl = frontendRedirectUrl;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // Derive merID from email: john.doe@company.com → john.doe
        String merID = email != null ? email.split("@")[0] : "unknown";

        // Upsert user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .merID(merID)
                    .email(email)
                    .displayName(name != null ? name : merID)
                    .ssoProvider("google")
                    .role("USER")
                    .createdAt(Instant.now())
                    .build();
            return userRepository.save(newUser);
        });

        // Update last login
        user.setUpdatedAt(Instant.now());
        if (name != null && !name.equals(user.getDisplayName())) {
            user.setDisplayName(name);
        }
        userRepository.save(user);

        // Issue JWT
        String token = jwtUtil.generateToken(user.getMerID(), user.getEmail());

        // Redirect to frontend with token
        String redirectUrl = frontendRedirectUrl
                + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8)
                + "&merID=" + URLEncoder.encode(user.getMerID(), StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
