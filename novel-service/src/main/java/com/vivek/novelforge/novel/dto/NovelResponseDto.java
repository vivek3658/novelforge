package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.CategoryType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NovelResponseDto {
    private Long id;

    private String title;

    private String synopsis;

    private CategoryType categoryType;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
