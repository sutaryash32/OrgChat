package com.orgchat.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No JWT token for: {} {}", request.getMethod(), uri);
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        log.debug("JWT Bearer token detected for URI: {}", uri);

        JwtUtil.TokenValidationResult result = jwtUtil.validateToken(token);

        switch (result) {
            case VALID -> {
                String merID = jwtUtil.extractMerID(token);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                merID, null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.info("Authenticated user '{}' for request: {} {}", merID, request.getMethod(), uri);
            }
            case EXPIRED -> {
                // Expired tokens are not authenticated but not rejected outright —
                // let the request proceed as anonymous so /auth/refresh can still be called
                log.info("Expired JWT for request: {} {}", request.getMethod(), uri);
                SecurityContextHolder.clearContext();
            }
            case TAMPERED, INVALID -> {
                // Hard reject — forged or malformed tokens get a 401 immediately
                log.warn("Rejected tampered/malformed JWT from IP={} for {} {}",
                        request.getRemoteAddr(), request.getMethod(), uri);
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Unauthorized: invalid token");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}