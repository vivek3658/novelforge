
package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.request.UpdateUserProfileRequestDto;
import com.vivek.novelforge.identity.dto.response.UserProfileResponseDto;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.UserProfileService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDto getMyProfile(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);
        UserProfile profile = getProfile(user.getId());

        return toResponseDto(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDto getProfileByUserId(Long userId) {
        UserProfile profile = getProfile(userId);

        if (profile.getVisibility() != ProfileVisibility.PUBLIC) {
            throw new AccessDeniedException(
                    "This profile is private."
            );
        }

        return toResponseDto(profile);
    }

    @Override
    public UserProfileResponseDto updateMyProfile(
            Authentication authentication,
            UpdateUserProfileRequestDto request
    ) {
        User user = getAuthenticatedUser(authentication);
        UserProfile profile = getProfile(user.getId());

        profile.setDisplayName(request.getDisplayName().trim());
        profile.setBio(request.getBio());

        if (request.getVisibility() != null) {
            profile.setVisibility(request.getVisibility());
        }

        UserProfile savedProfile = userProfileRepository.save(profile);

        return toResponseDto(savedProfile);
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
