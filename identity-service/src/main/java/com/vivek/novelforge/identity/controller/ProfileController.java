package com.vivek.novelforge.identity.controller;
import com.vivek.novelforge.identity.service.CreatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final CreatorService creatorService;

    @PostMapping("/creator")
    public ResponseEntity<?> becomeCreator(Authentication authentication) {
        return ResponseEntity.ok(
                creatorService.activateCreator(authentication)
        );
    }

    @PostMapping("/creator/deactivate")
    public ResponseEntity<?> deactivateCreator(Authentication authentication) {
        return ResponseEntity.ok(
                creatorService.deactivateCreator(authentication)
        );
    }
}