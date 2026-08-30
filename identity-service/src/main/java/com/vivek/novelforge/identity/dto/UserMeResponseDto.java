package com.vivek.novelforge.identity.dto;

import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.RoleType;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserMeResponseDto {
    private Long id;
    private String username;
    private String email;
    private RoleType roleType;
    private Boolean emailVerified;
    private AccountStatus accountStatus;
}
