package com.vivek.novelforge.novel.scheduler;

import com.vivek.novelforge.novel.service.NovelCleanupService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NovelCleanupScheduler {
    private final NovelCleanupService novelCleanupService;

    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupExpiredNovels() {
        novelCleanupService.permanentlyDeleteExpiredNovels();
    }
}
