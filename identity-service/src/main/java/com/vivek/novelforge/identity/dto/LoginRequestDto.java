package com.vivek.novelforge.identity.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class LoginRequestDto {
    private String username;
    private String password;
}
