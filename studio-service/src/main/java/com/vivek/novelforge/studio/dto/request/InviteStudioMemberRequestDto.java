// dto/request/InviteStudioMemberRequestDto.java
package com.vivek.novelforge.studio.dto.request;

import com.vivek.novelforge.studio.type.StudioRoleType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class InviteStudioMemberRequestDto {

    @NotNull
    @Positive
    private Long inviteeUserId;

    @NotNull
    private StudioRoleType role;
}