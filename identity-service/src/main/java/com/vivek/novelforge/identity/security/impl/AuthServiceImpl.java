package com.vivek.novelforge.identity.security.impl;

import com.vivek.novelforge.identity.dto.*;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.exception.UsernameAlreadyExistsException;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.security.AuthService;
import com.vivek.novelforge.identity.security.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
    public LoginResultDto login(LoginRequestDto loginRequestDto) {
        String username;
        if(loginRequestDto.getIdentifier().contains("@")){
            User user = userRepository.findByEmail(loginRequestDto.getIdentifier()).orElseThrow();
            username = user.getUsername();
        }else{
            username = loginRequestDto.getIdentifier();
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username,loginRequestDto.getPassword())
        );
        User user = (User) authentication.getPrincipal();
        String accessToken = authUtil.generateAccessToken(user);
        String refreshToken =
                authUtil.generateRefreshToken(user);
        return new LoginResultDto(
                user.getId(),
                user.getUsername(),
                accessToken,
                refreshToken
        );
    }

    @Override
    public LoginResponseDto refreshAccessToken(String refreshToken) {

        String username =
                authUtil.getUsernameFromRefreshToken(refreshToken);

        User user = userRepository
                .findByUsername(username)
                .orElseThrow();

        String accessToken =
                authUtil.generateAccessToken(user);

        return new LoginResponseDto(
                user.getId(),
                user.getUsername(),
                accessToken
        );
    }


}
