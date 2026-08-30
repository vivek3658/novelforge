package com.vivek.novelforge.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ResetPasswordRequestDto {
    @NotBlank
    @Email
    private String email;
    @NotBlank
    @Size(min = 8,max = 100)
    private String newPassword;
}
