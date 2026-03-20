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
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            log.debug("JWT Bearer token detected for URI: {}", uri);

            try {
                if (jwtUtil.validateToken(token)) {
                    String merID = jwtUtil.extractMerID(token);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    merID, null,
                                    List.of(new SimpleGrantedAuthority("ROLE_USER")));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.info("Authenticated user '{}' for request: {} {}", merID, request.getMethod(), uri);
                } else {
                    log.warn("Invalid JWT for request: {} {} — token validation failed", request.getMethod(), uri);
                }
            } catch (Exception e) {
                log.error("JWT authentication error for {} {}: {}", request.getMethod(), uri, e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            log.debug("No JWT token for: {} {}", request.getMethod(), uri);
        }

        filterChain.doFilter(request, response);
    }
}
