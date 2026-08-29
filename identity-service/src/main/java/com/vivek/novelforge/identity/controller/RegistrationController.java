package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.RegisterResponseDto;
import com.vivek.novelforge.identity.dto.SendOtpRequestDto;
import com.vivek.novelforge.identity.dto.VerifyOtpRequestDto;
import com.vivek.novelforge.identity.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(registrationService.register(registerRequestDto));
    }


}
