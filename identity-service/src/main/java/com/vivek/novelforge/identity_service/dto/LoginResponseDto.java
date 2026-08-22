package com.vivek.novelforge.identity_service.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class LoginResponseDto {
    private String message;
    private String username;
    private String token;

}
