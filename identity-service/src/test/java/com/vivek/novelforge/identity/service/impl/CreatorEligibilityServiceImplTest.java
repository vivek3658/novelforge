package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorEligibilityServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private CreatorEligibilityServiceImpl service;

    private User user;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(42L)
                .username("creator")
                .email("creator@example.com")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        profile = UserProfile.builder()
                .id(42L)
                .displayName("Creator")
                .creatorStatus(CreatorStatus.ACTIVE)
                .build();

        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(userProfileRepository.findById(42L))
                .thenReturn(Optional.of(profile));
    }

    @Test
    void allowsActiveAccountWithActiveCreatorProfile() {
        service.requireActiveCreator(42L);
    }

    @Test
    void rejectsNonActiveAccount() {
        user.setAccountStatus(AccountStatus.BLOCKED);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.requireActiveCreator(42L)
        );

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void rejectsCreatorThatIsNotActive() {
        profile.setCreatorStatus(CreatorStatus.DEACTIVATED);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.requireActiveCreator(42L)
        );

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void rejectsMissingUserOrProfile() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.requireActiveCreator(42L)
        );

        assertEquals(403, exception.getStatusCode().value());
    }
}
