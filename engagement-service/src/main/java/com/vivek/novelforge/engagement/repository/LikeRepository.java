package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.EngagementLike;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<EngagementLike, Long> {
    Optional<EngagementLike> findByUserIdAndTargetTypeAndTargetId(Long userId, EngagementTargetType type, String targetId);
    long countByTargetTypeAndTargetIdAndDeletedAtIsNull(EngagementTargetType type, String targetId);
}
