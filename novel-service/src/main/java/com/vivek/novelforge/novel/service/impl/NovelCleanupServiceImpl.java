package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.novel.repository.NovelRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class NovelCleanupServiceImpl {
    private final NovelRepository novelRepository;

    @Transactional
    public void permanentlyDeleteExpiredNovels() {

        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);

        int deletedCount =
                novelRepository.deleteExpiredNovels(cutoff);

        System.out.println(
                "Permanently deleted " + deletedCount + " expired novels"
        );
    }
}
