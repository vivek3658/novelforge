package com.vivek.novelforge.identity_service.security;

import com.vivek.novelforge.identity_service.dto.LoginRequestDto;
import com.vivek.novelforge.identity_service.dto.LoginResponseDto;
import com.vivek.novelforge.identity_service.dto.RegisterRequestDto;
import com.vivek.novelforge.identity_service.dto.RegisterResponseDto;

public interface AuthService {
    LoginResponseDto login(LoginRequestDto loginRequestDto);
    RegisterResponseDto register(RegisterRequestDto registerRequestDto);
    String logout();
    String forgotPassword();
}
