package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.engagement.types.FollowTargetType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "engagement_follows", uniqueConstraints = @UniqueConstraint(
        name = "uk_follow_user_target", columnNames = {"follower_user_id", "target_type", "target_id"}),
        indexes = @Index(name = "ix_follow_target", columnList = "target_type,target_id,deleted_at"))
@Getter @Setter @NoArgsConstructor
public class Follow extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "follower_user_id", nullable = false)
    private Long followerUserId;
    @Enumerated(EnumType.STRING) @Column(name = "target_type", nullable = false, length = 20)
    private FollowTargetType targetType;
    @Column(name = "target_id", nullable = false, length = 80)
    private String targetId;

    public Follow(Long userId, FollowTargetType type, String targetId) {
        this.followerUserId = userId;
        this.targetType = type;
        this.targetId = targetId;
    }
}
