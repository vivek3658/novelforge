package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.EngagementShare;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShareRepository extends JpaRepository<EngagementShare, Long> {
    Optional<EngagementShare> findByUserIdAndPostId(Long userId, Long postId);
    long countByPostIdAndDeletedAtIsNull(Long postId);
}
