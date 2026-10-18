package com.vivek.novelforge.identity.dto.request;

import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateUserProfileRequestDto {
    private Long userId;
    private String username;
    private String displayName;
    private String bio;
    private String profileImageName;
    private String bannerImageName;
    private ProfileVisibility visibility;
    private CreatorStatus creatorStatus;
}
