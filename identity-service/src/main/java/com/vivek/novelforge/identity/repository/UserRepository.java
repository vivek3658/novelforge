package com.vivek.novelforge.identity.repository;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.RoleType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByAccountStatusAndDeletedAtBefore(
            AccountStatus accountStatus,
            Instant cutoff
    );

    long countByAccountStatus(AccountStatus accountStatus);

    long countByCreatorStatus(CreatorStatus creatorStatus);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r = :role")
    long countByRole(@Param("role") RoleType role);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.userProfile up " +
            "WHERE u.accountStatus = :accountStatus " +
            "AND (LOWER(u.username) LIKE LOWER(:query) OR LOWER(u.email) LIKE LOWER(:query)) " +
            "ORDER BY u.username ASC")
    List<User> searchActiveMatching(
            @Param("query") String query,
            @Param("accountStatus") AccountStatus accountStatus,
            Pageable pageable
    );
}
