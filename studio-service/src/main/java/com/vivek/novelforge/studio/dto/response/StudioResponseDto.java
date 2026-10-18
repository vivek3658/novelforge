// dto/response/StudioResponseDto.java
package com.vivek.novelforge.studio.dto.response;

import com.vivek.novelforge.studio.type.StudioStatus;
import com.vivek.novelforge.studio.type.VisibilityType;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

import java.util.UUID;

@Data
@Builder
public class StudioResponseDto {
    private UUID id;
    private String studioName;
    private String studioHandle;
    private String profileImageName;
    private String bannerImageName;
    private String description;
    private VisibilityType visibilityType;
    private StudioStatus status;
}