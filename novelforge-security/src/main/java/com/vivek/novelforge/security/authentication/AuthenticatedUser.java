package com.vivek.novelforge.security.authentication;

import java.util.List;

public record AuthenticatedUser(
        String userId,
        String username,
        List<String> roles,
        List<String> authorities
) {}