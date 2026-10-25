package com.vivek.novelforge.novel.scheduler;

import com.vivek.novelforge.novel.entity.Chapter;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.repository.ChapterRepository;
import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.types.PublicationState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChapterPublicationScheduler {
    private final ChapterRepository chapterRepository;
    private final NovelRepository novelRepository;
    private final MongoTemplate mongoTemplate;
    private final CacheManager cacheManager;

    /** Persisted SCHEDULED records survive restarts; the conditional update makes multiple replicas safe. */
    @Scheduled(fixedDelayString = "${novelforge.chapters.publish-poll-ms:10000}")
    public void publishDueChapters() {
        Instant now = Instant.now();
        List<Chapter> due = chapterRepository
                .findTop50ByPublicationStateAndScheduledAtLessThanEqualAndDeletedAtIsNullOrderByScheduledAtAsc(
                        PublicationState.SCHEDULED, now);
        for (Chapter candidate : due) {
            try {
                Novel novel = novelRepository.findByIdAndDeletedAtIsNull(candidate.getNovelId()).orElse(null);
                if (novel == null || novel.getPublicationState() != PublicationState.PUBLISHED) {
                    continue;
                }
                Query claim = Query.query(Criteria.where("_id").is(candidate.getId())
                        .and("publicationState").is(PublicationState.SCHEDULED)
                        .and("scheduledAt").lte(now)
                        .and("version").is(candidate.getVersion())
                        .and("deletedAt").is(null));
                Update publish = new Update()
                        .set("publicationState", PublicationState.PUBLISHED)
                        .set("publishedAt", now)
                        .set("scheduledAt", null)
                        .set("updatedAt", now)
                        .inc("version", 1);
                Chapter published = mongoTemplate.findAndModify(
                        claim, publish, FindAndModifyOptions.options().returnNew(true), Chapter.class);
                if (published != null) {
                    evictPublicChapterCaches(published.getNovelId(), published.getId());
                    log.info("Published scheduled chapter chapterId={} novelId={}",
                            published.getId(), published.getNovelId());
                }
            } catch (RuntimeException exception) {
                log.error("Scheduled chapter publication failed chapterId={}", candidate.getId(), exception);
            }
        }
    }

    private void evictPublicChapterCaches(Long novelId, String chapterId) {
        var detailCache = cacheManager.getCache("publicChapterDetails");
        if (detailCache != null) detailCache.evict(novelId + ":" + chapterId);
        var pageCache = cacheManager.getCache("publicChapterPages");
        if (pageCache != null) pageCache.clear();
    }
}
