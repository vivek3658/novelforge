package com.vivek.novelforge.identity.scheduler;

import com.vivek.novelforge.identity.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountCleanupScheduler {

    private final AccountService accountService;

    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupDeletedAccounts() {
        accountService.cleanupDeletedAccounts();
    }
}