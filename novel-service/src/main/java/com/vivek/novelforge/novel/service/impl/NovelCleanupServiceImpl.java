package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.repository.ChapterRepository;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.service.NovelCleanupService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class NovelCleanupServiceImpl implements NovelCleanupService {
    private final NovelRepository novelRepository;
    private final ChapterRepository chapterRepository;

    @Override
    @Transactional
    public void permanentlyDeleteExpiredNovels() {

        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);

        long deletedChapters = chapterRepository.deleteByDeletedAtLessThan(cutoff);
        int deletedNovels = 0;
        for (Novel novel : novelRepository.findTop100ByDeletedAtIsNotNullAndDeletedAtLessThanOrderByDeletedAtAsc(cutoff)) {
            // Remove the Mongo documents before the owning relational row. Repeating this is safe after a crash.
            chapterRepository.deleteByNovelId(novel.getId());
            novelRepository.delete(novel);
            deletedNovels++;
        }
        log.info("Purged expired content: novels={} chapters={}", deletedNovels, deletedChapters);
    }
}
