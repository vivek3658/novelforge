
package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.AccountService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

    private final UserRepository userRepository;

    @Override
    public void requestAccountDeletion(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);

        if (user.getAccountStatus() == AccountStatus.PENDING_DELETION) {
            return;
        }

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Only active accounts can request deletion."
            );
        }

        user.setAccountStatus(AccountStatus.PENDING_DELETION);
        user.setDeletedAt(Instant.now());

        userRepository.save(user);
    }

    @Override
    public void cancelAccountDeletion(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);

        if (user.getAccountStatus() != AccountStatus.PENDING_DELETION) {
            throw new IllegalStateException(
                    "Your account does not have a pending deletion request."
            );
        }

        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setDeletedAt(null);

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new IllegalStateException("User is not authenticated.");
        }

        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new EntityNotFoundException("Authenticated user not found.")
                );
    }

    @Override
    public void cleanupDeletedAccounts() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);

        List<User> usersToDelete =
                userRepository.findByAccountStatusAndDeletedAtBefore(
                        AccountStatus.PENDING_DELETION,
                        cutoff
                );

        if (!usersToDelete.isEmpty()) {
            userRepository.deleteAll(usersToDelete);
        }
    }
}
