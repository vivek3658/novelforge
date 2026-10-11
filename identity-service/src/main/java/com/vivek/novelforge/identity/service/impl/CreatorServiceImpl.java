
package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.response.UserProfileResponseDto;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.CreatorService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;

@Service
@RequiredArgsConstructor
@Transactional
public class CreatorServiceImpl implements CreatorService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    public UserProfileResponseDto activateCreator(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);
        UserProfile profile = getProfile(user.getId());

        if (profile.getCreatorStatus() == CreatorStatus.SUSPENDED) {
            throw new AccessDeniedException(
                    "Suspended creators cannot reactivate themselves."
            );
        }

        profile.setCreatorStatus(CreatorStatus.ACTIVE);

        return toResponseDto(userProfileRepository.save(profile));
    }

    @Override
    public UserProfileResponseDto deactivateCreator(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);
        UserProfile profile = getProfile(user.getId());

        if (profile.getCreatorStatus() == CreatorStatus.SUSPENDED) {
            throw new AccessDeniedException(
                    "A suspended creator cannot change their status."
            );
        }

        if (profile.getCreatorStatus() == CreatorStatus.NONE) {
            return toResponseDto(profile);
        }

        profile.setCreatorStatus(CreatorStatus.DEACTIVATED);

        return toResponseDto(userProfileRepository.save(profile));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication is required.");
        }

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new EntityNotFoundException("User not found.")
                );

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new AccessDeniedException("Account is not active.");
        }

        return user;
    }

    private UserProfile getProfile(Long userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() ->
                        new EntityNotFoundException("User profile not found.")
                );
    }

    private UserProfileResponseDto toResponseDto(UserProfile profile) {
        return UserProfileResponseDto.builder()
                .userId(profile.getUser().getId())
                .username(profile.getUser().getUsername())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .profileImageName(profile.getProfileImageName())
                .bannerImageName(profile.getBannerImageName())
                .visibility(profile.getVisibility())
                .creatorStatus(profile.getCreatorStatus())
                .build();
    }
}
