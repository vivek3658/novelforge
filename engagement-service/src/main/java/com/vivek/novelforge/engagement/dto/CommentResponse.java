package com.vivek.novelforge.engagement.dto;

import com.vivek.novelforge.engagement.types.EngagementTargetType;
import java.time.Instant;

public record CommentResponse(Long id, Long userId, EngagementTargetType targetType,
                              String targetId, String content, Instant createdAt, Instant updatedAt) {}
