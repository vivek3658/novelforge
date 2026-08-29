package com.vivek.novelforge.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
    private String username;
    @NotBlank
    private String password;
    private String profileImageName;
}
