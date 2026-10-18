// dto/request/UpdateStudioRequestDto.java
package com.vivek.novelforge.studio.dto.request;

import com.vivek.novelforge.studio.type.VisibilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateStudioRequestDto {

    @NotBlank
    @Size(min = 3, max = 50)
    private String studioName;

    @NotBlank
    @Size(min = 3, max = 50)
    private String studioHandle;

    @Size(max = 200)
    private String profileImageName;

    @Size(max = 200)
    private String bannerImageName;

    @Size(max = 500)
    private String description;

    @NotNull
    private VisibilityType visibilityType;
}