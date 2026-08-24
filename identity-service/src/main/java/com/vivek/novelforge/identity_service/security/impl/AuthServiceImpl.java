package com.vivek.novelforge.identity_service.security.impl;

import com.vivek.novelforge.identity_service.dto.LoginRequestDto;
import com.vivek.novelforge.identity_service.dto.LoginResponseDto;
import com.vivek.novelforge.identity_service.dto.RegisterRequestDto;
import com.vivek.novelforge.identity_service.dto.RegisterResponseDto;
import com.vivek.novelforge.identity_service.entity.User;
import com.vivek.novelforge.identity_service.repository.UserRepository;
import com.vivek.novelforge.identity_service.security.AuthService;
import com.vivek.novelforge.identity_service.security.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final AuthUtil authUtil;

    @Override
    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDto.getUsername(),loginRequestDto.getPassword())
        );
        User user = (User) authentication.getPrincipal();
        String token = authUtil.generateAccessToken(user);
        return new LoginResponseDto(user.getId(),token);
    }

    @Override
    public RegisterResponseDto register(RegisterRequestDto registerRequestDto) {
        return null;
    }

    @Override
    public String logout() {
        return "";
    }

    @Override
    public String forgotPassword() {
        return "";
    }
}
