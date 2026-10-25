package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "engagement_shares", uniqueConstraints = @UniqueConstraint(
        name = "uk_share_user_post", columnNames = {"user_id", "post_id"}),
        indexes = @Index(name = "ix_share_post", columnList = "post_id,deleted_at"))
@Getter @Setter @NoArgsConstructor
public class EngagementShare extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "post_id", nullable = false)
    private Long postId;
    public EngagementShare(Long userId, Long postId) { this.userId = userId; this.postId = postId; }
}
