package com.vivek.novelforge.notification_service.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class EmailRequestDto {
    private String email;
    private String otp;
}
