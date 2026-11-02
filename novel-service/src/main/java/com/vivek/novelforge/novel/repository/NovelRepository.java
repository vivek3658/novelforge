package com.vivek.novelforge.novel.repository;

import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.types.CategoryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface NovelRepository extends JpaRepository<Novel, Long> {
    boolean existsByStudioIdAndDeletedAtIsNullAndTitleIgnoreCase(UUID studioId, String title);

    Optional<Novel> findByIdAndDeletedAtIsNull(Long id);

    List<Novel> findTop100ByDeletedAtIsNotNullAndDeletedAtLessThanOrderByDeletedAtAsc(Instant cutoff);

    @Query(value = """
        SELECT n FROM Novel n
        WHERE n.deletedAt IS NULL
          AND n.publicationState = com.vivek.novelforge.novel.types.PublicationState.PUBLISHED
          AND (:query = '' OR LOWER(n.title) LIKE CONCAT('%', :query, '%')
               OR LOWER(COALESCE(n.synopsis, '')) LIKE CONCAT('%', :query, '%'))
          AND (:category IS NULL OR n.categoryType = :category)
          AND (:genre IS NULL OR :genre MEMBER OF n.genres)
          AND (:tag IS NULL OR :tag MEMBER OF n.tags)
        """,
        countQuery = """
        SELECT COUNT(n) FROM Novel n
        WHERE n.deletedAt IS NULL
          AND n.publicationState = com.vivek.novelforge.novel.types.PublicationState.PUBLISHED
          AND (:query = '' OR LOWER(n.title) LIKE CONCAT('%', :query, '%')
               OR LOWER(COALESCE(n.synopsis, '')) LIKE CONCAT('%', :query, '%'))
          AND (:category IS NULL OR n.categoryType = :category)
          AND (:genre IS NULL OR :genre MEMBER OF n.genres)
          AND (:tag IS NULL OR :tag MEMBER OF n.tags)
        """)
    Page<Novel> searchNovels(
            @Param("query") String query,
            @Param("category") CategoryType category,
            @Param("genre") String genre,
            @Param("tag") String tag,
            Pageable pageable
    );

    Page<Novel> findByStudioIdAndDeletedAtIsNull(UUID studioId, Pageable pageable);
}
