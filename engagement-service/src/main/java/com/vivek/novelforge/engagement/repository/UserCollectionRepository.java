package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.UserCollection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserCollectionRepository extends JpaRepository<UserCollection, Long> {
    List<UserCollection> findByOwnerUserIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long ownerUserId);
    Optional<UserCollection> findByIdAndOwnerUserIdAndDeletedAtIsNull(Long id, Long ownerUserId);
    Optional<UserCollection> findByOwnerUserIdAndSystemKeyAndDeletedAtIsNull(Long ownerUserId, String systemKey);
    boolean existsByOwnerUserIdAndNameIgnoreCaseAndDeletedAtIsNull(Long ownerUserId, String name);
}
