package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "engagement_likes", uniqueConstraints = @UniqueConstraint(
        name = "uk_like_user_target", columnNames = {"user_id", "target_type", "target_id"}),
        indexes = @Index(name = "ix_like_target", columnList = "target_type,target_id,deleted_at"))
@Getter @Setter @NoArgsConstructor
public class EngagementLike extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Enumerated(EnumType.STRING) @Column(name = "target_type", nullable = false, length = 20)
    private EngagementTargetType targetType;
    @Column(name = "target_id", nullable = false, length = 80)
    private String targetId;

    public EngagementLike(Long userId, EngagementTargetType type, String targetId) {
        this.userId = userId;
        this.targetType = type;
        this.targetId = targetId;
    }
}
