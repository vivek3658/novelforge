package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.exception.UsernameAlreadyExistsException;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserProfileServiceImpl service;

    private User user;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(42L)
                .username("reader")
                .accountStatus(AccountStatus.ACTIVE)
                .build();
        profile = UserProfile.builder()
                .id(42L)
                .user(user)
                .displayName("Reader")
                .build();
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("42", "reader", List.of(), List.of()));
        when(userRepository.findByUsername("reader")).thenReturn(Optional.of(user));
        when(userProfileRepository.findById(42L)).thenReturn(Optional.of(profile));
    }

    @Test
    void updatesUsernameAndProfileImageUrl() {
        var request = com.vivek.novelforge.identity.dto.request.UpdateUserProfileRequestDto.builder()
                .username("new-reader")
                .displayName("New Reader")
                .profileImageName("https://ik.imagekit.io/novelforge/avatar.png")
                .build();
        when(userRepository.existsByUsername("new-reader")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.updateMyProfile(authentication, request);

        assertEquals("new-reader", response.getUsername());
        assertEquals("https://ik.imagekit.io/novelforge/avatar.png", response.getProfileImageName());
        verify(userRepository).save(user);
        verify(userProfileRepository).save(profile);
    }

    @Test
    void rejectsUsernameAlreadyOwnedByAnotherAccount() {
        var request = com.vivek.novelforge.identity.dto.request.UpdateUserProfileRequestDto.builder()
                .username("taken")
                .displayName("Reader")
                .build();
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThrows(UsernameAlreadyExistsException.class,
                () -> service.updateMyProfile(authentication, request));
        verify(userRepository, never()).save(any(User.class));
        verify(userProfileRepository, never()).save(any(UserProfile.class));
    }
}