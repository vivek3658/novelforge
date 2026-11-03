package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.response.UserSearchResultDto;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.impl.UserDirectoryServiceImpl;
import com.vivek.novelforge.identity.type.AccountStatus;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserDirectoryControllerTest {

    @Test
    void searchUsers_returnsPublicDirectoryRecords() {
        UserRepository userRepository = mock(UserRepository.class);
        UserProfileRepository userProfileRepository = mock(UserProfileRepository.class);
        UserDirectoryServiceImpl service = new UserDirectoryServiceImpl(userRepository, userProfileRepository);

        User user = new User();
        user.setId(42L);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setAccountStatus(AccountStatus.ACTIVE);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setDisplayName("Alice Writer");
        profile.setProfileImageName("https://ik.imagekit.io/example/alice-avatar.png");

        when(userRepository.searchActiveMatching("%ali%", AccountStatus.ACTIVE, PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "username"))))
                .thenReturn(List.of(user));
        when(userProfileRepository.findById(42L)).thenReturn(Optional.of(profile));

        List<UserSearchResultDto> results = service.searchUsers("ali", 10);

        assertEquals(1, results.size());
        assertEquals(42L, results.get(0).id());
        assertEquals("alice", results.get(0).username());
        assertEquals("Alice Writer", results.get(0).displayName());
        assertEquals("https://ik.imagekit.io/example/alice-avatar.png", results.get(0).avatarUrl());
    }
}
