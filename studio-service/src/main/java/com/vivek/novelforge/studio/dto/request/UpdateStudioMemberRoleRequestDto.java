// dto/request/UpdateStudioMemberRoleRequestDto.java
package com.vivek.novelforge.studio.dto.request;

import com.vivek.novelforge.studio.type.StudioRoleType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStudioMemberRoleRequestDto {

    @NotNull
    private StudioRoleType role;
}