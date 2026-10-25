package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.FeedEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface FeedEntryRepository extends JpaRepository<FeedEntry, Long> {
    @Query("select f from FeedEntry f where f.userId = :userId and "
            + "(f.createdAt < :before or (f.createdAt = :before and f.postId < :tieId)) "
            + "order by f.createdAt desc, f.postId desc")
    List<FeedEntry> findBefore(@Param("userId") Long userId, @Param("before") Instant before,
                               @Param("tieId") Long tieId, Pageable pageable);

    @Modifying
    @Query(value = "insert into engagement_feed_entries (user_id, post_id, created_at) "
            + "values (:userId, :postId, :createdAt) on conflict (user_id, post_id) do nothing", nativeQuery = true)
    int insertIfAbsent(@Param("userId") Long userId, @Param("postId") Long postId,
                       @Param("createdAt") Instant createdAt);

    @Modifying
    @Query(value = "insert into engagement_feed_entries (user_id, post_id, created_at) "
            + "select f.follower_user_id, :postId, :createdAt from engagement_follows f "
            + "where f.target_type = :targetType and f.target_id = :targetId and f.deleted_at is null "
            + "on conflict (user_id, post_id) do nothing", nativeQuery = true)
    int fanoutPost(@Param("postId") Long postId, @Param("createdAt") Instant createdAt,
                   @Param("targetType") String targetType, @Param("targetId") String targetId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
}
