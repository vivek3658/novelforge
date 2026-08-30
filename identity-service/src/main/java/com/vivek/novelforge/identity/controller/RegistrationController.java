package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.*;
import com.vivek.novelforge.identity.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/register")
public class RegistrationController {
    private final RegistrationService registrationService;
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@Valid @RequestBody SendOtpRequestDto sendOtpRequestDto){
        System.out.println("EMAIL RECEIVED: " + sendOtpRequestDto.getEmail());

        registrationService.sendVerificationOtp(sendOtpRequestDto.getEmail());

        System.out.println("OTP SERVICE COMPLETED");
        return ResponseEntity.ok("OTP send Successfully");
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@Valid @RequestBody VerifyOtpRequestDto verifyOtpRequestDto){
        boolean verified = registrationService.verifyOtp(verifyOtpRequestDto.getEmail(),verifyOtpRequestDto.getOtp());
        if(!verified){
            return ResponseEntity.badRequest().body("Invalid or Expired OTP");
        }else{
            return ResponseEntity.ok("Email Verified Successfully");
        }
    }
    @PostMapping
    public ResponseEntity<RegisterResponseDto> register(@Valid @RequestBody RegisterRequestDto registerRequestDto){
        RegistrationResultDto result = registrationService.register(registerRequestDto);
        ResponseCookie refreshCookie = ResponseCookie
                .from("refreshToken", result.getRefreshToken())
                .httpOnly(true)
                .secure(false) // false for localhost HTTP
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(30))
                .build();

        RegisterResponseDto response =
                RegisterResponseDto.builder()
                        .message("Registration Successful")
                        .userId(result.getUserId())
                        .username(result.getUsername())
                        .accessToken(result.getAccessToken())
                        .build();

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshCookie.toString()
                )
                .body(response);
    }


}
