package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.EngagementPost;
import com.vivek.novelforge.engagement.types.PostAuthorType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface PostRepository extends JpaRepository<EngagementPost, Long> {
    Page<EngagementPost> findByDeletedAtIsNull(Pageable pageable);
    List<EngagementPost> findTop100ByAuthorTypeAndAuthorIdInAndDeletedAtIsNullAndCreatedAtBeforeOrderByCreatedAtDesc(
            PostAuthorType authorType, List<String> authorIds, Instant before);

    @Query("select p from EngagementPost p where p.authorType = :type and p.authorId in :authors "
            + "and p.deletedAt is null and (p.createdAt < :before or (p.createdAt = :before and p.id < :tieId)) "
            + "order by p.createdAt desc, p.id desc")
    List<EngagementPost> findBeforeForAuthors(@Param("type") PostAuthorType type,
            @Param("authors") List<String> authors, @Param("before") Instant before,
            @Param("tieId") Long tieId, Pageable pageable);
}
