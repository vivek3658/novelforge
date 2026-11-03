package com.vivek.novelforge.identity.dto.response;

public record UserSearchResultDto(
        Long id,
        String username,
        String displayName,
        String avatarUrl
) {
}
