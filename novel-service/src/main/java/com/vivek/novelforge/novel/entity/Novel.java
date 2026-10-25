package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.novel.types.CategoryType;
import com.vivek.novelforge.novel.types.PublicationState;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "novel", indexes = {
        @Index(name = "ix_novels_studio_state_created", columnList = "studio_id, publication_state, created_at"),
        @Index(name = "ix_novels_publication_deleted", columnList = "publication_state, deleted_at")
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Novel extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Scalar reference: Studio Service owns Studio records and membership rules.
    @Column(name = "studio_id", nullable = false)
    private UUID studioId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String synopsis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private CategoryType categoryType;

    @ElementCollection
    @CollectionTable(name = "novel_genre_values", joinColumns = @JoinColumn(name = "novel_id"),
            indexes = @Index(name = "ix_novel_genres_slug", columnList = "genre_slug"))
    @Column(name = "genre_slug", nullable = false, length = 60)
    @Builder.Default
    private Set<String> genres = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "novel_tag_values", joinColumns = @JoinColumn(name = "novel_id"),
            indexes = @Index(name = "ix_novel_tags_slug", columnList = "tag_slug"))
    @Column(name = "tag_slug", nullable = false, length = 60)
    @Builder.Default
    private Set<String> tags = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "publication_state", nullable = false, length = 24)
    @ColumnDefault("'DRAFT'")
    @Builder.Default
    private PublicationState publicationState = PublicationState.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "publication_state_before_deletion", length = 24)
    private PublicationState publicationStateBeforeDeletion;

    private Instant publishedAt;
}
