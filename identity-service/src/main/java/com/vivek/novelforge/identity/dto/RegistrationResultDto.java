package com.vivek.novelforge.identity.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class RegistrationResultDto {
    private Long userId;
    private String username;
    private String accessToken;
    private String refreshToken;
}
