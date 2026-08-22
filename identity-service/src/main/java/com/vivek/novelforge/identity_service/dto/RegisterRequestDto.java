package com.vivek.novelforge.identity_service.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class RegisterRequestDto {
    private String name;
}
