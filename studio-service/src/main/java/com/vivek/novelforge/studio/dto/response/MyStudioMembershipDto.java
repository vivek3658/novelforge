package com.vivek.novelforge.studio.dto.response;

import lombok.Builder;
import lombok.Value;

import java.util.Set;
import java.util.UUID;

@Value
@Builder
public class MyStudioMembershipDto {
    UUID studioId;
    Long userId;
    Set<String> permissions;
}
