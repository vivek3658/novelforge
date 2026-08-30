package com.vivek.novelforge.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class LoginRequestDto {
    @NotBlank
    private String identifier;
    @NotBlank
    private String password;
}
