package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.request.AdminUpdateRolesRequestDto;
import com.vivek.novelforge.identity.dto.request.AdminUpdateStatusRequestDto;
import com.vivek.novelforge.identity.dto.response.AdminPlatformStatsDto;
import com.vivek.novelforge.identity.dto.response.AdminUserResponseDto;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.AdminUserService;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.RoleType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponseDto> getUsers(
            String query,
            RoleType role,
            AccountStatus accountStatus,
            CreatorStatus creatorStatus,
            Pageable pageable
    ) {
        Specification<User> spec = (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }

            if (role != null) {
                predicates.add(cb.isMember(role, root.get("roles")));
            }

            if (accountStatus != null) {
                predicates.add(cb.equal(root.get("accountStatus"), accountStatus));
            }

            if (creatorStatus != null) {
                predicates.add(cb.equal(root.get("creatorStatus"), creatorStatus));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponseDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toDto(user);
    }

    @Override
    @Transactional
    public AdminUserResponseDto updateUserRoles(Long userId, AdminUpdateRolesRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setRoles(new ArrayList<>(request.getRoles()));
        User saved = userRepository.save(user);
        log.info("Admin updated roles for user {}: {}", user.getUsername(), request.getRoles());
        return toDto(saved);
    }

    @Override
    @Transactional
    public AdminUserResponseDto updateUserStatus(Long userId, AdminUpdateStatusRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getAccountStatus() != null) {
            user.setAccountStatus(request.getAccountStatus());
            log.info("Admin updated account status for user {} to {}", user.getUsername(), request.getAccountStatus());
        }

        if (request.getCreatorStatus() != null) {
            user.setCreatorStatus(request.getCreatorStatus());
            if (user.getUserProfile() != null) {
                user.getUserProfile().setCreatorStatus(request.getCreatorStatus());
                userProfileRepository.save(user.getUserProfile());
            }
            log.info("Admin updated creator status for user {} to {}", user.getUsername(), request.getCreatorStatus());
        }

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminPlatformStatsDto getPlatformStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByAccountStatus(AccountStatus.ACTIVE);
        long blockedUsers = userRepository.countByAccountStatus(AccountStatus.BLOCKED);
        long activeCreators = userRepository.countByCreatorStatus(CreatorStatus.ACTIVE);
        long adminCount = userRepository.countByRole(RoleType.ADMIN);
        long moderatorCount = userRepository.countByRole(RoleType.MODERATOR);

        return AdminPlatformStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .blockedUsers(blockedUsers)
                .activeCreators(activeCreators)
                .adminCount(adminCount)
                .moderatorCount(moderatorCount)
                .build();
    }

    private AdminUserResponseDto toDto(User user) {
        UserProfile profile = user.getUserProfile();
        return AdminUserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .roles(user.getRoles())
                .accountStatus(user.getAccountStatus())
                .creatorStatus(user.getCreatorStatus())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .bio(profile != null ? profile.getBio() : null)
                .profileImageName(profile != null ? profile.getProfileImageName() : null)
                .visibility(profile != null ? profile.getVisibility() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
