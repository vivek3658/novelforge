package com.vivek.novelforge.novel.dto;

import com.vivek.novelforge.novel.types.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NovelRequestDto {
    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String synopsis;

    @NotNull
    private CategoryType categoryType;
}
