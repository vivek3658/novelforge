package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.RegisterResponseDto;

public interface RegistrationService {
    void sendVerificationOtp(String email);
    boolean verifyOtp(String email,String otp);
    RegisterResponseDto register(RegisterRequestDto registerRequestDto);
}
