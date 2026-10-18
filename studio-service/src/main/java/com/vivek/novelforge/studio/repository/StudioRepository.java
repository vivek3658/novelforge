package com.vivek.novelforge.studio.repository;

import com.vivek.novelforge.studio.entity.Studio;
import com.vivek.novelforge.studio.type.StudioStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudioRepository extends JpaRepository<Studio, UUID> {

    Optional<Studio> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByStudioHandleIgnoreCaseAndDeletedAtIsNull(String studioHandle);

    boolean existsByStudioHandleIgnoreCaseAndIdNotAndDeletedAtIsNull(
            String studioHandle,
            UUID id
    );

    @Query("""
        SELECT s FROM Studio s
        WHERE s.deletedAt IS NULL
          AND s.status = com.vivek.novelforge.studio.type.StudioStatus.ACTIVE
          AND s.visibilityType = com.vivek.novelforge.studio.type.VisibilityType.PUBLIC
          AND (
              LOWER(s.studioName) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(s.studioHandle) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        """)
    Page<Studio> searchPublicStudios(
            @Param("query") String query,
            Pageable pageable
    );

    Page<Studio> findByStatusAndDeletedAtBefore(
            StudioStatus status,
            Instant cutoff,
            Pageable pageable
    );
}