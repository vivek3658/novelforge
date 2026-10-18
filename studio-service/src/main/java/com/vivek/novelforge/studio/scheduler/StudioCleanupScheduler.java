package com.vivek.novelforge.studio.scheduler;

import com.vivek.novelforge.studio.service.StudioCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StudioCleanupScheduler {

    private final StudioCleanupService cleanupService;

    @Scheduled(cron = "0 0 2 * * *")
    public void purgeExpiredStudios() {
        int deleted = cleanupService.permanentlyDeleteExpiredStudios();
        if (deleted > 0) {
            log.info("Studio cleanup completed: {} Studios purged", deleted);
        }
    }
}