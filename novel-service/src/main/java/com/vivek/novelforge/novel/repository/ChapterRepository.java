package com.vivek.novelforge.novel.repository;

import com.vivek.novelforge.novel.entity.Chapter;
import com.vivek.novelforge.novel.types.PublicationState;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ChapterRepository extends MongoRepository<Chapter, String> {
    Optional<Chapter> findByIdAndNovelIdAndDeletedAtIsNull(String id, Long novelId);

    boolean existsByNovelIdAndChapterNumberAndDeletedAtIsNull(Long novelId, Integer chapterNumber);

    Page<Chapter> findByNovelIdAndDeletedAtIsNullAndPublicationStateIn(
            Long novelId,
            Collection<PublicationState> states,
            Pageable pageable
    );

    List<Chapter> findTop50ByPublicationStateAndScheduledAtLessThanEqualAndDeletedAtIsNullOrderByScheduledAtAsc(
            PublicationState publicationState,
            Instant scheduledAt
    );

    long deleteByNovelId(Long novelId);

    long deleteByDeletedAtLessThan(Instant cutoff);
}
