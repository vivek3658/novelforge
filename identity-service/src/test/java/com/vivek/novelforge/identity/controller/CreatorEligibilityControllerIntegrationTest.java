package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
//@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:identity-eligibility;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.data.redis.repositories.enabled=false",
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "identity.internal.client-secret=integration-test-secret",
        "novelforge.security.jwt.secret-key=integration-test-jwt-secret-key-which-is-long-enough"
})
class CreatorEligibilityControllerIntegrationTest {

    private static final String SECRET_HEADER = "X-Internal-Service-Key";
    private static final String SECRET = "integration-test-secret";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private User creator;

    @BeforeEach
    void setUp() {
        userProfileRepository.deleteAll();
        userRepository.deleteAll();

        creator = userRepository.save(User.builder()
                .username("active_creator")
                .email("active-creator@example.com")
                .emailVerified(true)
                .roles(List.of())
                .accountStatus(AccountStatus.ACTIVE)
                .creatorStatus(CreatorStatus.ACTIVE)
                .build());

        userProfileRepository.save(UserProfile.builder()
                .user(creator)
                .displayName("Active Creator")
                .creatorStatus(CreatorStatus.ACTIVE)
                .build());
    }

    @Test
    void returnsNoContentForActiveCreatorWithValidInternalKey()
            throws Exception {
        mockMvc.perform(get("/internal/users/{userId}/creator-eligibility",
                        creator.getId())
                        .header(SECRET_HEADER, SECRET))
                .andExpect(status().isNoContent());
    }

    @Test
    void rejectsInvalidInternalKey() throws Exception {
        mockMvc.perform(get("/internal/users/{userId}/creator-eligibility",
                        creator.getId())
                        .header(SECRET_HEADER, "wrong-secret"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsCreatorWhoseAccountIsBlocked() throws Exception {
        creator.setAccountStatus(AccountStatus.BLOCKED);
        userRepository.save(creator);

        mockMvc.perform(get("/internal/users/{userId}/creator-eligibility",
                        creator.getId())
                        .header(SECRET_HEADER, SECRET))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsInactiveCreatorProfile() throws Exception {
        UserProfile profile = userProfileRepository.findById(creator.getId())
                .orElseThrow();
        profile.setCreatorStatus(CreatorStatus.DEACTIVATED);
        userProfileRepository.save(profile);

        mockMvc.perform(get("/internal/users/{userId}/creator-eligibility",
                        creator.getId())
                        .header(SECRET_HEADER, SECRET))
                .andExpect(status().isForbidden());
    }
}
