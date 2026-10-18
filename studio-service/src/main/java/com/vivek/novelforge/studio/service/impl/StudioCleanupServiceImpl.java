package com.vivek.novelforge.studio.service.impl;

import com.vivek.novelforge.studio.entity.Studio;
import com.vivek.novelforge.studio.repository.StudioMembershipRepository;
import com.vivek.novelforge.studio.repository.StudioRepository;
import com.vivek.novelforge.studio.service.StudioCleanupService;
import com.vivek.novelforge.studio.type.StudioStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudioCleanupServiceImpl implements StudioCleanupService {

    private final StudioRepository studioRepository;
    private final StudioMembershipRepository membershipRepository;

    @Override
    @Transactional
    public int permanentlyDeleteExpiredStudios() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);

        List<Studio> expired = studioRepository
                .findByStatusAndDeletedAtBefore(
                        StudioStatus.PENDING_DELETION,
                        cutoff,
                        PageRequest.of(0, 200))
                .getContent();

        if (expired.isEmpty()) {
            return 0;
        }

        List<UUID> studioIds = expired.stream()
                .map(Studio::getId)
                .toList();

        // Memberships use scalar studio IDs, so delete them before Studios.
        membershipRepository.deleteByStudioIdIn(studioIds);
        studioRepository.deleteAll(expired);

        log.info("Permanently deleted {} expired Studios", expired.size());
        return expired.size();
    }
}