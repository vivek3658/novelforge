package com.vivek.novelforge.common.event;

import java.time.Instant;
import java.util.UUID;

/** Message contract for OTP email delivery across service boundaries. */
public record OtpEmailRequestedEvent(
        UUID notificationId,
        UUID challengeId,
        String flowId,
        String purpose,
        String email,
        String otp,
        Instant expiresAt
) {}
