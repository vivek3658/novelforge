package com.vivek.novelforge.engagement.dto;

import com.vivek.novelforge.engagement.types.EngagementTargetType;

import java.time.Instant;

public record CollectionItemResponse(Long id, EngagementTargetType targetType, String targetId,
                                     Instant savedAt) {}
