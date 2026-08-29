package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.LoginRequestDto;
import com.vivek.novelforge.identity.dto.LoginResponseDto;
import com.vivek.novelforge.identity.security.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto){
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }
//    @GetMapping("/me")
//    public ResponseEntity<>
}
