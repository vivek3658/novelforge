package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.request.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.response.RegistrationResultDto;

public interface RegistrationService {
    void sendVerificationOtp(String email, String flowId, String clientIp);
    boolean verifyOtp(String email, String otp, String flowId, String clientIp);
    boolean isCurrentOtpChallenge(String email, String flowId, String challengeId);
    RegistrationResultDto register(RegisterRequestDto registerRequestDto, String flowId);
}
