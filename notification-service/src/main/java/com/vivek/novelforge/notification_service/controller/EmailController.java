package com.vivek.novelforge.notification_service.controller;

import com.vivek.novelforge.notification_service.dto.EmailRequestDto;
import com.vivek.novelforge.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/email")
@Slf4j
public class EmailController {

    private final EmailService emailService;

    @PostMapping
    public String sendOtp(@RequestBody EmailRequestDto emailRequestDto) {

        log.info("========== EMAIL CONTROLLER HIT ==========");
        log.info("Email: {}", emailRequestDto.getEmail());
        log.info("OTP: {}", emailRequestDto.getOtp());

        emailService.sendOtp(
                emailRequestDto.getEmail(),
                emailRequestDto.getOtp()
        );

        log.info("========== EMAIL SENT ==========");

        return "Email Sent";
    }
}
