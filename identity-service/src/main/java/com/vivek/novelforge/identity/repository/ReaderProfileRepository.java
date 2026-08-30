package com.vivek.novelforge.identity.repository;

import com.vivek.novelforge.identity.entity.ReaderProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReaderProfileRepository extends JpaRepository<ReaderProfile, Long> {
    Optional<ReaderProfile> findByUserId(Long userId);
}
