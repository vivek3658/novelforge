package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.type.AccountStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AccountServiceImpl accountService;

    private User user;

    @BeforeEach
    void setUp() {

        user = User.builder()
                .id(1L)
                .username("vivek")
                .email("vivek@example.com")
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    void shouldRequestAccountDeletion() {

        when(authentication.getName()).thenReturn("vivek");

        when(userRepository.findByUsername("vivek"))
                .thenReturn(Optional.of(user));

        accountService.requestAccountDeletion(authentication);

        assertEquals(
                AccountStatus.PENDING_DELETION,
                user.getAccountStatus()
        );

        assertNotNull(user.getDeletedAt());

        verify(userRepository).save(user);
    }

    @Test
    void shouldNotRequestDeletionIfAlreadyDeleted() {

        user.setAccountStatus(AccountStatus.DELETED);

        when(authentication.getName()).thenReturn("vivek");

        when(userRepository.findByUsername("vivek"))
                .thenReturn(Optional.of(user));

        assertThrows(
                IllegalStateException.class,
                () -> accountService.requestAccountDeletion(authentication)
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void shouldNotRequestDeletionIfAlreadyPending() {

        user.setAccountStatus(AccountStatus.PENDING_DELETION);

        when(authentication.getName()).thenReturn("vivek");

        when(userRepository.findByUsername("vivek"))
                .thenReturn(Optional.of(user));

        assertThrows(
                IllegalStateException.class,
                () -> accountService.requestAccountDeletion(authentication)
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void shouldCancelAccountDeletion() {

        user.setAccountStatus(AccountStatus.PENDING_DELETION);
        user.setDeletedAt(Instant.now());

        when(authentication.getName()).thenReturn("vivek");

        when(userRepository.findByUsername("vivek"))
                .thenReturn(Optional.of(user));

        accountService.cancelAccountDeletion(authentication);

        assertEquals(
                AccountStatus.ACTIVE,
                user.getAccountStatus()
        );

        assertNull(user.getDeletedAt());

        verify(userRepository).save(user);
    }

    @Test
    void shouldNotCancelDeletionIfAccountIsNotPending() {

        user.setAccountStatus(AccountStatus.ACTIVE);

        when(authentication.getName()).thenReturn("vivek");

        when(userRepository.findByUsername("vivek"))
                .thenReturn(Optional.of(user));

        assertThrows(
                IllegalStateException.class,
                () -> accountService.cancelAccountDeletion(authentication)
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void shouldGetAuthenticatedUser() {

        when(authentication.getName()).thenReturn("vivek");

        when(userRepository.findByUsername("vivek"))
                .thenReturn(Optional.of(user));

        User result =
                accountService.getAuthenticatedUser(authentication);

        assertNotNull(result);
        assertEquals("vivek", result.getUsername());

        verify(userRepository).findByUsername("vivek");
    }

    @Test
    void shouldThrowWhenAuthenticatedUserDoesNotExist() {

        when(authentication.getName()).thenReturn("unknown");

        when(userRepository.findByUsername("unknown"))
                .thenReturn(Optional.empty());

        assertThrows(
                IllegalStateException.class,
                () -> accountService.getAuthenticatedUser(authentication)
        );
    }

    @Test
    void shouldCleanupAccountsOlderThan30Days() {

        User pendingUser = User.builder()
                .id(2L)
                .username("olduser")
                .email("old@example.com")
                .accountStatus(AccountStatus.PENDING_DELETION)
                .build();

        pendingUser.setDeletedAt(
                Instant.now().minusSeconds(31L * 24 * 60 * 60)
        );

        when(userRepository.findByAccountStatusAndDeletedAtBefore(
                eq(AccountStatus.PENDING_DELETION),
                any(Instant.class)
        )).thenReturn(List.of(pendingUser));

        accountService.cleanupDeletedAccounts();

        assertEquals(
                AccountStatus.DELETED,
                pendingUser.getAccountStatus()
        );

        verify(userRepository).save(pendingUser);
    }

    @Test
    void shouldCleanupMultipleAccounts() {

        User user1 = User.builder()
                .id(2L)
                .username("user1")
                .accountStatus(AccountStatus.PENDING_DELETION)
                .build();

        User user2 = User.builder()
                .id(3L)
                .username("user2")
                .accountStatus(AccountStatus.PENDING_DELETION)
                .build();

        when(userRepository.findByAccountStatusAndDeletedAtBefore(
                eq(AccountStatus.PENDING_DELETION),
                any(Instant.class)
        )).thenReturn(List.of(user1, user2));

        accountService.cleanupDeletedAccounts();

        assertEquals(AccountStatus.DELETED, user1.getAccountStatus());
        assertEquals(AccountStatus.DELETED, user2.getAccountStatus());

        verify(userRepository).save(user1);
        verify(userRepository).save(user2);
    }

    @Test
    void shouldNotSaveWhenThereAreNoAccountsToCleanup() {

        when(userRepository.findByAccountStatusAndDeletedAtBefore(
                eq(AccountStatus.PENDING_DELETION),
                any(Instant.class)
        )).thenReturn(List.of());

        accountService.cleanupDeletedAccounts();

        verify(userRepository, never()).save(any());
    }
}