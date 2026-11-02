package com.vivek.novelforge.engagement.dto;

import com.vivek.novelforge.engagement.types.EngagementTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveCollectionItemRequest(
        @NotNull EngagementTargetType targetType,
        @NotBlank @Size(max = 100) String targetId
) {}
