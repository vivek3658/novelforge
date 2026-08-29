package com.vivek.novelforge.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VerifyOtpRequestDto {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    @Pattern(
            regexp = "\\d{6}",
            message = "OTP must be exactly 6 digits"
    )
    private String otp;
}
