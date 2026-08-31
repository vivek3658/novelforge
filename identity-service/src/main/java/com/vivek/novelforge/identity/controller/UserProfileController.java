package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user-profile")
public class UserProfileController {
    private final UserProfileService userProfileService;

    @PreAuthorize("hasAuthority('BECOME_AUTHOR')")
    @PostMapping("/become-author")
    public ResponseEntity<Void> becomeAuthor(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        userProfileService.becomeAuthor(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
