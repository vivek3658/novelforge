
package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.request.UpdateUserProfileRequestDto;
import com.vivek.novelforge.identity.dto.response.UserProfileResponseDto;
import org.springframework.security.core.Authentication;

public interface UserProfileService {

    UserProfileResponseDto getMyProfile(Authentication authentication);

    UserProfileResponseDto getProfileByUserId(Long userId);

    UserProfileResponseDto updateMyProfile(
            Authentication authentication,
            UpdateUserProfileRequestDto request
    );
}
