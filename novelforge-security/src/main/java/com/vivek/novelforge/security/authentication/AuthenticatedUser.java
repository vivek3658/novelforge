package com.vivek.novelforge.security.authentication;

import org.springframework.security.core.Authentication;

import java.util.List;

public record AuthenticatedUser(
        String userId,
        String username,
        List<String> roles,
        List<String> authorities
) {
        public static String usernameFrom(Authentication authentication) {
                if (authentication == null) return null;
                Object principal = authentication.getPrincipal();
                return principal instanceof AuthenticatedUser user ? user.username() : authentication.getName();
        }
}