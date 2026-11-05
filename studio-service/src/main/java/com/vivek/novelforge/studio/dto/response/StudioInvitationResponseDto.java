package com.vivek.novelforge.studio.dto.response;

import com.vivek.novelforge.studio.type.StudioRoleType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class StudioInvitationResponseDto {
    private Long membershipId;
    private String studioName;
    private String studioHandle;
    private StudioRoleType role;
    private Instant invitedAt;
    private Instant readAt;
}