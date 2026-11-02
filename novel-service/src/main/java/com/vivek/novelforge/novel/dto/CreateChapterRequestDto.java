package com.vivek.novelforge.novel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateChapterRequestDto {
    @NotNull
    @Positive
    private Integer chapterNumber;

    @NotBlank
    @Size(max = 200)
    private String title;
}
