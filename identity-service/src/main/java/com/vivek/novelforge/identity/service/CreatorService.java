package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import org.springframework.security.core.Authentication;

public interface CreatorService {
    UserProfile activateCreator(Authentication authentication);
    UserProfile deactivateCreator(Authentication authentication);
    UserProfile getUserProfile(User user);
}
