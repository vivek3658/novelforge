package com.vivek.novelforge.identity.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPlatformStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long blockedUsers;
    private long activeCreators;
    private long adminCount;
    private long moderatorCount;
}
