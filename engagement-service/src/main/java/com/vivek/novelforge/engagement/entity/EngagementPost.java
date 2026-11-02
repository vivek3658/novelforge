package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.engagement.types.PostAuthorType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "engagement_posts", indexes = {
        @Index(name = "ix_post_author_created", columnList = "author_type,author_id,created_at,deleted_at"),
        @Index(name = "ix_post_created", columnList = "created_at,deleted_at")})
@Getter @Setter @NoArgsConstructor
public class EngagementPost extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(name = "author_type", nullable = false, length = 20)
    private PostAuthorType authorType;
    @Column(name = "author_id", nullable = false, length = 80)
    private String authorId;
    @Column(name = "created_by_user_id", nullable = false)
    private Long createdByUserId;
    @Column(nullable = false, length = 3000)
    private String content;
    @Column(name = "image_url", length = 2048)
    private String imageUrl;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "engagement_post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag", nullable = false, length = 40)
    private Set<String> tags = new LinkedHashSet<>();
}
