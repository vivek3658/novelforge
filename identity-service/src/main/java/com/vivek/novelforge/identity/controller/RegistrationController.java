package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.request.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.request.SendOtpRequestDto;
import com.vivek.novelforge.identity.dto.request.VerifyOtpRequestDto;
import com.vivek.novelforge.identity.dto.response.RegisterResponseDto;
import com.vivek.novelforge.identity.dto.response.RegistrationResultDto;
import com.vivek.novelforge.identity.service.RegistrationService;
import com.vivek.novelforge.identity.security.OtpFlowCookieSupport;
import com.vivek.novelforge.identity.security.ClientIpResolver;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
@RequestMapping("/register")
public class RegistrationController {
    private final RegistrationService registrationService;
    private final OtpFlowCookieSupport otpFlowCookieSupport;
    private final ClientIpResolver clientIpResolver;
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(
            @Valid @RequestBody SendOtpRequestDto sendOtpRequestDto,
            @CookieValue(name = "otpFlowId", required = false) String existingFlowId,
            HttpServletRequest request
    ) {
        String flowId = otpFlowCookieSupport.resolveOrCreate(existingFlowId);
        registrationService.sendVerificationOtp(
                sendOtpRequestDto.getEmail(), flowId, clientIpResolver.resolve(request));
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .header(HttpHeaders.SET_COOKIE, otpFlowCookieSupport.cookie("otpFlowId", flowId).toString())
                .body("OTP delivery request accepted");
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(
            @Valid @RequestBody VerifyOtpRequestDto verifyOtpRequestDto,
            @CookieValue(name = "otpFlowId", required = false) String flowCookie,
            HttpServletRequest request
    ) {
        String flowId = otpFlowCookieSupport.resolveOrCreate(flowCookie);
        boolean verified = registrationService.verifyOtp(
                verifyOtpRequestDto.getEmail(), verifyOtpRequestDto.getOtp(), flowId,
                clientIpResolver.resolve(request));
        if(!verified){
            return ResponseEntity.badRequest().body("Invalid or Expired OTP");
        }else{
            return ResponseEntity.ok("Email Verified Successfully");
        }
    }
    @PostMapping
    public ResponseEntity<RegisterResponseDto> register(
            @Valid @RequestBody RegisterRequestDto registerRequestDto,
            @CookieValue(name = "otpFlowId", required = false) String flowCookie
    ) {
        String flowId = otpFlowCookieSupport.resolveOrCreate(flowCookie);
        RegistrationResultDto result = registrationService.register(registerRequestDto, flowId);
        ResponseCookie refreshCookie = ResponseCookie
                .from("refreshToken", result.getRefreshToken())
                .httpOnly(true)
                .secure(otpFlowCookieSupport.isSecure())
                .sameSite(otpFlowCookieSupport.isSecure() ? "None" : "Lax")
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
                .header(HttpHeaders.SET_COOKIE, otpFlowCookieSupport.expiredCookie("otpFlowId").toString())
                .body(response);
    }


}
