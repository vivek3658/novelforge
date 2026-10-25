package com.vivek.novelforge.novel.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateChapterRequestDto {
    @Positive
    private Integer chapterNumber;

    @Size(min = 1, max = 200)
    private String title;
}
