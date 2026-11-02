package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.request.AdminUpdateRolesRequestDto;
import com.vivek.novelforge.identity.dto.request.AdminUpdateStatusRequestDto;
import com.vivek.novelforge.identity.dto.response.AdminPlatformStatsDto;
import com.vivek.novelforge.identity.dto.response.AdminUserResponseDto;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {

    Page<AdminUserResponseDto> getUsers(
            String query,
            RoleType role,
            AccountStatus accountStatus,
            CreatorStatus creatorStatus,
            Pageable pageable
    );

    AdminUserResponseDto getUserById(Long userId);

    AdminUserResponseDto updateUserRoles(Long userId, AdminUpdateRolesRequestDto request);

    AdminUserResponseDto updateUserStatus(Long userId, AdminUpdateStatusRequestDto request);

    AdminPlatformStatsDto getPlatformStats();
}
