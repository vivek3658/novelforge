package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.CreatorEligibilityService;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CreatorEligibilityServiceImpl implements CreatorEligibilityService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    public void requireActiveCreator(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        UserProfile profile = userProfileRepository.findById(userId).orElse(null);

        // Use a generic response so this internal API does not reveal
        // whether a particular user ID exists.
        if (user == null
                || profile == null
                || user.getDeletedAt() != null
                || profile.getDeletedAt() != null
                || user.getAccountStatus() != AccountStatus.ACTIVE
                || profile.getCreatorStatus() != CreatorStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "An active creator account is required."
            );
        }
    }
}