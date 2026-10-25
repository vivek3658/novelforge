package com.vivek.novelforge.engagement.dto;

import com.vivek.novelforge.engagement.types.PostAuthorType;

import java.time.Instant;
import java.util.Set;

public record PostResponse(Long id, PostAuthorType authorType, String authorId, Long createdByUserId,
                           String content, String imageUrl, Set<String> tags, Instant createdAt) {}
