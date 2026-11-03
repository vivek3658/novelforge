package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.response.UserSearchResultDto;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.UserDirectoryService;
import com.vivek.novelforge.identity.type.AccountStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDirectoryServiceImpl implements UserDirectoryService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    public List<UserSearchResultDto> searchUsers(String query, int limit) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            return List.of();
        }

        int safeLimit = limit > 0 ? Math.min(limit, 10) : 10;
        String pattern = "%" + normalizedQuery.toLowerCase() + "%";

        return userRepository.searchActiveMatching(
                        pattern,
                        AccountStatus.ACTIVE,
                        PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.ASC, "username")))
                .stream()
                .map(this::toSearchResult)
                .toList();
    }

    private UserSearchResultDto toSearchResult(User user) {
        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        String displayName = profile != null && profile.getDisplayName() != null
                ? profile.getDisplayName()
                : user.getUsername();
        String avatarUrl = profile != null ? profile.getProfileImageName() : null;

        return new UserSearchResultDto(
                user.getId(),
                user.getUsername(),
                displayName,
                avatarUrl
        );
    }
}
