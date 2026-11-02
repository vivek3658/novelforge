package com.vivek.novelforge.novel.client;

import java.util.Set;
import java.util.UUID;

public record MyStudioMembershipDto(UUID studioId, Long userId, Set<String> permissions) {}
