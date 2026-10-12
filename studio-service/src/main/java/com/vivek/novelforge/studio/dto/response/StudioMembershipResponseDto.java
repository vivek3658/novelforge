// dto/response/StudioMembershipResponseDto.java
package com.vivek.novelforge.studio.dto.response;

import com.vivek.novelforge.studio.type.StudioMembershipStatus;
import com.vivek.novelforge.studio.type.StudioRoleType;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class StudioMembershipResponseDto {
    private Long id;
    private UUID studioId;
    private Long userId;
    private StudioRoleType role;
    private StudioMembershipStatus status;
    private Instant invitedAt;
    private Instant joinedAt;
}