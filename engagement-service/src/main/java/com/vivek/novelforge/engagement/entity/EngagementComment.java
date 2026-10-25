package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "engagement_comments", indexes = @Index(
        name = "ix_comment_target_created", columnList = "target_type,target_id,created_at"))
@Getter @Setter @NoArgsConstructor
public class EngagementComment extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Enumerated(EnumType.STRING) @Column(name = "target_type", nullable = false, length = 20)
    private EngagementTargetType targetType;
    @Column(name = "target_id", nullable = false, length = 80)
    private String targetId;
    @Column(nullable = false, length = 2000)
    private String content;

    public EngagementComment(Long userId, EngagementTargetType type, String targetId, String content) {
        this.userId = userId;
        this.targetType = type;
        this.targetId = targetId;
        this.content = content;
    }
}
