package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.ChapterContentType;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ChapterBlockResponseDto {
    String id;
    Integer position;
    ChapterContentType type;
    String text;
    String imageUrl;
    String caption;
    String altText;
}
