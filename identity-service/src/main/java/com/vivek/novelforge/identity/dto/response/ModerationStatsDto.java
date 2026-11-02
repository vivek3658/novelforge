package com.vivek.novelforge.identity.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationStatsDto {
    private long pendingCount;
    private long resolvedCount;
    private long dismissedCount;
    private long totalCount;
}
