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
            @AuthenticationPrincipal Object principal,
            java.security.Principal securityPrincipal
    ) {
        String username = null;
        if (principal instanceof com.vivek.novelforge.security.authentication.AuthenticatedUser authUser) {
            username = authUser.username();
        } else if (principal instanceof UserDetails ud) {
            username = ud.getUsername();
        } else if (securityPrincipal != null) {
            username = securityPrincipal.getName();
        }
        if (username != null) {
            userProfileService.becomeAuthor(username);
        }
        return ResponseEntity.ok().build();
    }
}
