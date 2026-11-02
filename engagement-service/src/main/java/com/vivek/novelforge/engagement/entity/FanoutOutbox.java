package com.vivek.novelforge.engagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "engagement_fanout_outbox", indexes = @Index(
        name = "ix_fanout_outbox_pending", columnList = "processed_at,created_at"))
@Getter @Setter @NoArgsConstructor
public class FanoutOutbox {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "post_id", nullable = false, unique = true)
    private Long postId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "processed_at")
    private Instant processedAt;

    public FanoutOutbox(Long postId) { this.postId = postId; }
}
