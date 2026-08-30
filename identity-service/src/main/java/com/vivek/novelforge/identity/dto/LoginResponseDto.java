package com.vivek.novelforge.identity.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class LoginResponseDto {
    private Long userId;
    private String username;
    private String accessToken;

}
