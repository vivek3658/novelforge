
package com.vivek.novelforge.identity.dto.response;

import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponseDto {

    private Long userId;
    private String username;
    private String displayName;
    private String bio;
    private String profileImageName;
    private String bannerImageName;
    private ProfileVisibility visibility;
    private CreatorStatus creatorStatus;
}
