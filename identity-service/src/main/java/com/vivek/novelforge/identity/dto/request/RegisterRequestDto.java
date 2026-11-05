package com.vivek.novelforge.identity.dto.request;

import com.vivek.novelforge.identity.type.ProfileVisibility;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class RegisterRequestDto {
    @Email
    private String email;
    @NotBlank
    @Size(min = 3, max = 30)
    private String username;
    @NotBlank
    private String password;
    @Size(max = 1000)
    private String profileImageName;
    @Size(max = 1000)
    private String bannerImageName;
    private ProfileVisibility profileVisibility;

}
