package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.request.AdminUpdateRolesRequestDto;
import com.vivek.novelforge.identity.dto.request.AdminUpdateStatusRequestDto;
import com.vivek.novelforge.identity.dto.response.AdminPlatformStatsDto;
import com.vivek.novelforge.identity.dto.response.AdminUserResponseDto;
import com.vivek.novelforge.identity.service.AdminUserService;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.RoleType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserResponseDto>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) RoleType role,
            @RequestParam(required = false) AccountStatus accountStatus,
            @RequestParam(required = false) CreatorStatus creatorStatus,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminUserService.getUsers(query, role, accountStatus, creatorStatus, pageable));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponseDto> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserService.getUserById(userId));
    }

    @PutMapping("/users/{userId}/roles")
    @PreAuthorize("hasAuthority('MODERATOR_UPDATE') or hasAuthority('USER_UPDATE') or hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponseDto> updateUserRoles(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUpdateRolesRequestDto request
    ) {
        return ResponseEntity.ok(adminUserService.updateUserRoles(userId, request));
    }

    @PatchMapping("/users/{userId}/status")
    @PreAuthorize("hasAuthority('USER_UPDATE') or hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponseDto> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUpdateStatusRequestDto request
    ) {
        return ResponseEntity.ok(adminUserService.updateUserStatus(userId, request));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('USER_READ') or hasRole('ADMIN')")
    public ResponseEntity<AdminPlatformStatsDto> getStats() {
        return ResponseEntity.ok(adminUserService.getPlatformStats());
    }
}
