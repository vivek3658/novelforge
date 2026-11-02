package com.vivek.novelforge.identity.dto.request;

import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateStatusRequestDto {
    private AccountStatus accountStatus;
    private CreatorStatus creatorStatus;
}
