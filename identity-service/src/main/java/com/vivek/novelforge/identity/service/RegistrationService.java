package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.RegisterResponseDto;
import com.vivek.novelforge.identity.dto.RegistrationResultDto;

public interface RegistrationService {
    void sendVerificationOtp(String email);
    boolean verifyOtp(String email,String otp);
    RegistrationResultDto register(RegisterRequestDto registerRequestDto);
}
