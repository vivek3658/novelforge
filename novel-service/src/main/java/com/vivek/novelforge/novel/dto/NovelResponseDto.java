package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.CategoryType;
import com.vivek.novelforge.novel.types.PublicationState;
import lombok.*;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NovelResponseDto implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private UUID studioId;

    private String title;

    private String synopsis;

    private CategoryType categoryType;

    private Set<String> genres;

    private Set<String> tags;

    private PublicationState publicationState;

    private Instant publishedAt;

    private Instant createdAt;

    private Instant updatedAt;
}
