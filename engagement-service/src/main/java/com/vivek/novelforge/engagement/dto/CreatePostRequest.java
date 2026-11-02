package com.vivek.novelforge.engagement.dto;

import com.vivek.novelforge.engagement.types.PostAuthorType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreatePostRequest(
        @NotNull PostAuthorType authorType,
        @NotBlank @Size(max = 80) String authorId,
        @NotBlank @Size(max = 3000) String content,
        @Size(max = 2048) String imageUrl,
        @Size(max = 20) Set<@NotBlank @Size(max = 40) String> tags
) {}
