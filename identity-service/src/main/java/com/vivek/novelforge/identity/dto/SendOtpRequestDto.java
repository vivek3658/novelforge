package com.vivek.novelforge.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SendOtpRequestDto {
    @Email
    @NotBlank
    private String email;
}
