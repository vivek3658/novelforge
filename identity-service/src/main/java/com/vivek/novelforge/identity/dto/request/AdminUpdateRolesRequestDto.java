package com.vivek.novelforge.identity.dto.request;

import com.vivek.novelforge.identity.type.RoleType;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateRolesRequestDto {
    @NotEmpty(message = "Roles list cannot be empty")
    private List<RoleType> roles;
}
