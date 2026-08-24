package com.vivek.novelforge.identity_service.controller;

import com.vivek.novelforge.identity_service.dto.LoginRequestDto;
import com.vivek.novelforge.identity_service.dto.LoginResponseDto;
import com.vivek.novelforge.identity_service.entity.User;
import com.vivek.novelforge.identity_service.repository.UserRepository;
import com.vivek.novelforge.identity_service.security.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {


    @GetMapping
    public String demo(){
        return "hello world";
    }
//    login,signup(signin),OTP Service,verify OTP,checkUsernameAvailability

}
