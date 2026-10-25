package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.service.CreatorEligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class CreatorEligibilityController {

    private static final String INTERNAL_KEY_HEADER =
            "X-Internal-Service-Key";

    private final CreatorEligibilityService creatorEligibilityService;

    @Value("${identity.internal.studio-client-secret:}")
    private String studioClientSecret;

    @Value("${identity.internal.engagement-client-secret:}")
    private String engagementClientSecret;

    @GetMapping("/{userId}/creator-eligibility")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requireActiveCreator(
            @PathVariable Long userId,
            @RequestHeader(
                    value = INTERNAL_KEY_HEADER,
                    required = false
            ) String suppliedClientSecret
    ) {
        verifyClientSecret(suppliedClientSecret);
        creatorEligibilityService.requireActiveCreator(userId);
    }

    private void verifyClientSecret(String suppliedSecret) {
        if (!matchesSecret(studioClientSecret, suppliedSecret)
                && !matchesSecret(engagementClientSecret, suppliedSecret)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid service credentials."
            );
        }
    }

    private boolean matchesSecret(String expected, String supplied) {
        return expected != null && !expected.isBlank() && supplied != null
                && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8));
    }
}
