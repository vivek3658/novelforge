package com.vivek.novelforge.engagement.dto;

import java.util.Set;
import java.util.UUID;

public record StudioMembershipDto(UUID studioId, Long userId, Set<String> permissions) {}
