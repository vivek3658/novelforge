
package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.response.UserProfileResponseDto;
import org.springframework.security.core.Authentication;

public interface CreatorService {

    UserProfileResponseDto activateCreator(Authentication authentication);

    UserProfileResponseDto deactivateCreator(Authentication authentication);
}
