package com.vivek.novelforge.identity.security;

import com.vivek.novelforge.identity.dto.request.LoginRequestDto;
import com.vivek.novelforge.identity.dto.response.LoginResponseDto;
import com.vivek.novelforge.identity.dto.response.LoginResultDto;

public interface AuthService {
    LoginResultDto login(LoginRequestDto loginRequestDto);
    LoginResponseDto refreshAccessToken(String refreshToken);
}
