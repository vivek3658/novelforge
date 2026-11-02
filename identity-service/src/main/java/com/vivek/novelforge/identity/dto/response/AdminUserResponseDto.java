package com.vivek.novelforge.identity.dto.response;

import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import com.vivek.novelforge.identity.type.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponseDto {
    private Long id;
    private String username;
    private String email;
    private Boolean emailVerified;
    private List<RoleType> roles;
    private AccountStatus accountStatus;
    private CreatorStatus creatorStatus;
    private String displayName;
    private String bio;
    private String profileImageName;
    private ProfileVisibility visibility;
    private Instant createdAt;
}
