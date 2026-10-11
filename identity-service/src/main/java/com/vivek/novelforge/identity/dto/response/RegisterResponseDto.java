package com.vivek.novelforge.identity.dto.response;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class RegisterResponseDto {
    private String message;
    private Long userId;
    private String username;
    private String accessToken;
}
