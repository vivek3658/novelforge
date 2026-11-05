package com.vivek.novelforge.identity.dto.request;

import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @NotBlank
    @Size(min = 3, max = 30)
    private String username;
    @NotBlank
    @Size(min = 1, max = 50)
    private String displayName;
    @Size(max = 2000)
    private String bio;
    @Size(max = 1000)
    private String profileImageName;
    @Size(max = 1000)
    private String bannerImageName;
    private ProfileVisibility visibility;
    private CreatorStatus creatorStatus;
}
