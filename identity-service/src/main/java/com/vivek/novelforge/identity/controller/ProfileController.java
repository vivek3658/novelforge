
package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.request.UpdateUserProfileRequestDto;
import com.vivek.novelforge.identity.dto.response.UserProfileResponseDto;
import com.vivek.novelforge.identity.service.CreatorService;
import com.vivek.novelforge.identity.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final CreatorService creatorService;
    private final UserProfileService userProfileService;

        @Value("${imagekit.private-key:}")
        private String imageKitPrivateKey;

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

        @GetMapping("/imagekit-auth")
        public ResponseEntity<Map<String, Object>> getImageKitUploadAuth() {
                if (imageKitPrivateKey == null || imageKitPrivateKey.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image uploads are not configured.");
                }

                String token = UUID.randomUUID().toString();
                long expire = Instant.now().getEpochSecond() + 2400;
                try {
                        Mac hmac = Mac.getInstance("HmacSHA1");
                        hmac.init(new SecretKeySpec(imageKitPrivateKey.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
                        String signature = HexFormat.of().formatHex(hmac.doFinal((token + expire).getBytes(StandardCharsets.UTF_8)));
                        return ResponseEntity.ok()
                                        .cacheControl(CacheControl.noStore())
                                        .body(Map.of("token", token, "expire", expire, "signature", signature));
                } catch (java.security.GeneralSecurityException exception) {
                        throw new IllegalStateException("Image upload authorization could not be generated.", exception);
                }
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
