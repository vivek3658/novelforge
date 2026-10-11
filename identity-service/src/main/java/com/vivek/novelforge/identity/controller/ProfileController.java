
package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.request.UpdateUserProfileRequestDto;
import com.vivek.novelforge.identity.dto.response.UserProfileResponseDto;
import com.vivek.novelforge.identity.service.CreatorService;
import com.vivek.novelforge.identity.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final CreatorService creatorService;
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDto> getMyProfile(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                userProfileService.getMyProfile(authentication)
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponseDto> getProfile(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                userProfileService.getProfileByUserId(userId)
        );
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponseDto> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequestDto request
    ) {
        return ResponseEntity.ok(
                userProfileService.updateMyProfile(authentication, request)
        );
    }

    @PostMapping("/creator")
    public ResponseEntity<UserProfileResponseDto> activateCreator(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                creatorService.activateCreator(authentication)
        );
    }

    @PostMapping("/creator/deactivate")
    public ResponseEntity<UserProfileResponseDto> deactivateCreator(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                creatorService.deactivateCreator(authentication)
        );
    }
}
