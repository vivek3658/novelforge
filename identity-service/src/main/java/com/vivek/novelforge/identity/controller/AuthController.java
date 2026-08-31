package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.*;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.security.AuthService;
import com.vivek.novelforge.identity.service.PasswordResetService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto){
        LoginResultDto result = authService.login(loginRequestDto);
        ResponseCookie refreshCookie = ResponseCookie
                .from("refreshToken",result.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(30))
                .build();
        LoginResponseDto loginResponseDto = new LoginResponseDto(
                result.getUserId(),
                result.getUsername(),
                result.getAccessToken()
        );
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,refreshCookie.toString())
                .body(loginResponseDto);
    }
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDto> refresh(
            @CookieValue("refreshToken") String refreshToken) {

        LoginResponseDto response =
                authService.refreshAccessToken(refreshToken);

        return ResponseEntity.ok(response);
    }
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<UserMeResponseDto> me(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(
                UserMeResponseDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .roles(user.getRoles())
                        .emailVerified(user.getEmailVerified())
                        .accountStatus(user.getAccountStatus())
                        .build()
        );
    }
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletResponse response
    ) {

        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );

        return ResponseEntity.noContent().build();
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @RequestBody @Valid ForgotPasswordRequestDto request
    ) {
        passwordResetService.sendResetOtp(request.getEmail());

        return ResponseEntity.ok().build();
    }
    @PostMapping("/forgot-password/verify")
    public ResponseEntity<Void> verifyForgotPasswordOtp(
            @RequestBody @Valid ForgotPasswordVerifyDto request
    ) {

        passwordResetService.verifyResetOtp(
                request.getEmail(),
                request.getOtp()
        );

        return ResponseEntity.ok().build();
    }
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Void> resetPassword(
            @RequestBody @Valid ResetPasswordRequestDto request
    ) {

        passwordResetService.resetPassword(
                request.getEmail(),
                request.getNewPassword()
        );

        return ResponseEntity.noContent().build();
    }
}
