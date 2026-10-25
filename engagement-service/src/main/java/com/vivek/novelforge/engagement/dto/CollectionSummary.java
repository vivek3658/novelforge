package com.vivek.novelforge.engagement.dto;

import java.time.Instant;

public record CollectionSummary(Long id, String name, String description, boolean systemCollection,
                                long itemCount, Instant createdAt) {}
