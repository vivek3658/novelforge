package com.vivek.novelforge.engagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "engagement_feed_entries", uniqueConstraints = @UniqueConstraint(
        name = "uk_feed_user_post", columnNames = {"user_id", "post_id"}),
        indexes = @Index(name = "ix_feed_user_created", columnList = "user_id,created_at"))
@Getter @Setter @NoArgsConstructor
public class FeedEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "post_id", nullable = false)
    private Long postId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public FeedEntry(Long userId, Long postId, Instant createdAt) {
        this.userId = userId;
        this.postId = postId;
        this.createdAt = createdAt;
    }
}
