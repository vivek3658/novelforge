package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.CollectionItem;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CollectionItemRepository extends JpaRepository<CollectionItem, Long> {
    Page<CollectionItem> findByCollectionIdAndDeletedAtIsNull(Long collectionId, Pageable pageable);
    Optional<CollectionItem> findByCollectionIdAndTargetTypeAndTargetId(Long collectionId,
            EngagementTargetType targetType, String targetId);
    long countByCollectionIdAndDeletedAtIsNull(Long collectionId);
    Optional<CollectionItem> findByIdAndCollectionIdAndDeletedAtIsNull(Long id, Long collectionId);
}
