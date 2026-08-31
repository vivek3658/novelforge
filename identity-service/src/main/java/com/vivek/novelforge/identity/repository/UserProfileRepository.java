package com.vivek.novelforge.identity.repository;

import com.vivek.novelforge.identity.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findUserById(Long userId);
}
