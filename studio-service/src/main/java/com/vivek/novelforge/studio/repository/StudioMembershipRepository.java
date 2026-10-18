package com.vivek.novelforge.studio.repository;

import com.vivek.novelforge.studio.entity.StudioMembership;
import com.vivek.novelforge.studio.type.StudioMembershipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudioMembershipRepository
        extends JpaRepository<StudioMembership, Long> {

    Optional<StudioMembership> findByStudioIdAndUserId(
            UUID studioId,
            Long userId
    );

    Optional<StudioMembership> findByStudioIdAndUserIdAndStatusAndDeletedAtIsNull(
            UUID studioId,
            Long userId,
            StudioMembershipStatus status
    );

    Page<StudioMembership> findByStudioIdAndStatusAndDeletedAtIsNull(
            UUID studioId,
            StudioMembershipStatus status,
            Pageable pageable
    );

    List<StudioMembership> findByStudioIdIn(List<UUID> studioIds);

    void deleteByStudioIdIn(List<UUID> studioIds);
}