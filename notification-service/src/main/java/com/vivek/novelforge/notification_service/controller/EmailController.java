package com.vivek.novelforge.notification_service.controller;

import com.vivek.novelforge.notification_service.dto.EmailRequestDto;
import com.vivek.novelforge.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/email")
public class EmailController {
    private final EmailService emailService;
    @PostMapping
    public String sendOtp(@RequestBody EmailRequestDto emailRequestDto){
        System.out.println("Calls Notification Service");
        emailService.sendOtp(emailRequestDto.getEmail(),emailRequestDto.getOtp());
        return "Email Sent";
    }
}
