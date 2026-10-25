package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.EngagementComment;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<EngagementComment, Long> {
    Page<EngagementComment> findByTargetTypeAndTargetIdAndDeletedAtIsNull(
            EngagementTargetType type, String targetId, Pageable pageable);
}
