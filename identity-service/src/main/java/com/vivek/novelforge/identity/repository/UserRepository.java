package com.vivek.novelforge.identity.repository;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.type.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByAccountStatusAndDeletedAtBefore(
            AccountStatus accountStatus,
            Instant cutoff
    );
}
