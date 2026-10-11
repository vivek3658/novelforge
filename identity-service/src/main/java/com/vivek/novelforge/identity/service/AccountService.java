package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.entity.User;
import org.springframework.security.core.Authentication;

public interface AccountService {
    void requestAccountDeletion(Authentication authentication);
    void cleanupDeletedAccounts();
    User getAuthenticatedUser(Authentication authentication);
    void cancelAccountDeletion(Authentication authentication);
}
