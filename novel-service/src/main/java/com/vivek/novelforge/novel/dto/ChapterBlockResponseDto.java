package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.ChapterContentType;
import lombok.Builder;
import lombok.Value;

import java.io.Serializable;

@Value
@Builder
public class ChapterBlockResponseDto implements Serializable {
    private static final long serialVersionUID = 1L;
    String id;
    Integer position;
    ChapterContentType type;
    String text;
    String imageUrl;
    String caption;
    String altText;
}
