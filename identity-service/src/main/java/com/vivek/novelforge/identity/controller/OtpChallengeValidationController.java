package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.service.PasswordResetService;
import com.vivek.novelforge.identity.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/otp-challenges")
public class OtpChallengeValidationController {
    private final RegistrationService registrationService;
    private final PasswordResetService passwordResetService;

    @Value("${identity.internal.client-secret:}")
    private String internalClientSecret;

    @GetMapping("/{challengeId}")
    public ResponseEntity<Void> validateCurrentChallenge(
            @PathVariable UUID challengeId,
            @RequestParam String purpose,
            @RequestParam String email,
            @RequestParam String flowId,
            HttpServletRequest request
    ) {
        if (!validInternalSecret(request.getHeader("X-Internal-Client-Secret"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
        boolean current = switch (purpose) {
            case "REGISTRATION" -> registrationService.isCurrentOtpChallenge(
                    normalizedEmail, flowId, challengeId.toString());
            case "PASSWORD_RESET" -> passwordResetService.isCurrentOtpChallenge(
                    normalizedEmail, flowId, challengeId.toString());
            default -> false;
        };
        return current
                ? ResponseEntity.noContent().build()
                : ResponseEntity.status(HttpStatus.GONE).build();
    }

    private boolean validInternalSecret(String supplied) {
        if (internalClientSecret == null || internalClientSecret.isBlank()
                || supplied == null) return false;
        return MessageDigest.isEqual(
                internalClientSecret.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8)
        );
    }
}
