package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.Follow;
import com.vivek.novelforge.engagement.types.FollowTargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerUserIdAndTargetTypeAndTargetId(Long userId, FollowTargetType type, String targetId);
    List<Follow> findByFollowerUserIdAndDeletedAtIsNull(Long userId);
    List<Follow> findByTargetTypeAndTargetIdAndDeletedAtIsNull(FollowTargetType type, String targetId);
    long countByTargetTypeAndTargetIdAndDeletedAtIsNull(FollowTargetType type, String targetId);

    @Query("select f.targetId as targetId, count(f.id) as followerCount from Follow f "
            + "where f.targetType = :type and f.targetId in :targets and f.deletedAt is null group by f.targetId")
    List<TargetFollowerCount> countFollowersByTargets(@Param("type") FollowTargetType type,
                                                       @Param("targets") List<String> targets);
}
