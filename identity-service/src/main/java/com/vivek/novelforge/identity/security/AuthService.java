package com.vivek.novelforge.identity.security;

import com.vivek.novelforge.identity.dto.LoginRequestDto;
import com.vivek.novelforge.identity.dto.LoginResponseDto;
import com.vivek.novelforge.identity.dto.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.RegisterResponseDto;

public interface AuthService {
    LoginResponseDto login(LoginRequestDto loginRequestDto);
//    RegisterResponseDto register(RegisterRequestDto registerRequestDto);
    String logout();
    String forgotPassword();
}
