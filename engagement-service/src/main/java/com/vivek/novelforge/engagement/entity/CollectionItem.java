package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "engagement_collection_items",
        uniqueConstraints = @UniqueConstraint(name = "uk_collection_item_target",
                columnNames = {"collection_id", "target_type", "target_id"}),
        indexes = @Index(name = "ix_collection_item_page", columnList = "collection_id,deleted_at,created_at"))
@Getter
@Setter
@NoArgsConstructor
public class CollectionItem extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "collection_id", nullable = false)
    private Long collectionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private EngagementTargetType targetType;

    @Column(name = "target_id", nullable = false, length = 100)
    private String targetId;

    public CollectionItem(Long collectionId, EngagementTargetType targetType, String targetId) {
        this.collectionId = collectionId;
        this.targetType = targetType;
        this.targetId = targetId;
    }
}
