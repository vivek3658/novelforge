package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.PublicationState;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.io.Serializable;
import java.util.List;

@Value
@Builder
public class ChapterResponseDto implements Serializable {
    private static final long serialVersionUID = 1L;
    String id;
    Long novelId;
    Integer chapterNumber;
    String title;
    List<ChapterBlockResponseDto> blocks;
    PublicationState publicationState;
    Instant scheduledAt;
    Instant publishedAt;
    Instant createdAt;
    Instant updatedAt;
}
