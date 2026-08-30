package com.vivek.novelforge.identity.security;

import com.vivek.novelforge.identity.dto.*;

public interface AuthService {
    LoginResultDto login(LoginRequestDto loginRequestDto);
    LoginResponseDto refreshAccessToken(String refreshToken);
}
