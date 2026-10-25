package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.ChapterContentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChapterBlockRequestDto {
    @NotNull
    @PositiveOrZero
    private Integer position;

    @NotNull
    private ChapterContentType type;

    @Size(max = 100_000)
    private String text;

    @Size(max = 2048)
    private String imageUrl;

    @Size(max = 500)
    private String caption;

    @Size(max = 500)
    private String altText;
}
