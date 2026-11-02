package com.vivek.novelforge.identity.config;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import com.vivek.novelforge.identity.type.RoleType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${novelforge.admin.default-username:admin}")
    private String defaultUsername;

    @Value("${novelforge.admin.default-email:admin@novelforge.com}")
    private String defaultEmail;

    @Value("${novelforge.admin.default-password:AdminPassword123!}")
    private String defaultPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.countByRole(RoleType.ADMIN) == 0) {
            log.info("No ADMIN user found in system. Seeding default platform admin account: {}", defaultUsername);

            if (userRepository.existsByUsername(defaultUsername) || userRepository.existsByEmail(defaultEmail)) {
                log.warn("Username {} or email {} already exists, skipping default admin seed.", defaultUsername, defaultEmail);
                return;
            }

            User admin = User.builder()
                    .username(defaultUsername)
                    .email(defaultEmail)
                    .passwordHash(passwordEncoder.encode(defaultPassword))
                    .emailVerified(true)
                    .accountStatus(AccountStatus.ACTIVE)
                    .creatorStatus(CreatorStatus.ACTIVE)
                    .roles(new ArrayList<>(List.of(RoleType.ADMIN, RoleType.MODERATOR, RoleType.USER)))
                    .build();

            User savedAdmin = userRepository.save(admin);

            UserProfile profile = UserProfile.builder()
                    .user(savedAdmin)
                    .displayName("Platform Administrator")
                    .bio("NovelForge System Administrator & Moderation Lead")
                    .visibility(ProfileVisibility.PUBLIC)
                    .creatorStatus(CreatorStatus.ACTIVE)
                    .build();

            userProfileRepository.save(profile);
            log.info("Default platform admin successfully created: @{} ({})", defaultUsername, defaultEmail);
        }
    }
}
