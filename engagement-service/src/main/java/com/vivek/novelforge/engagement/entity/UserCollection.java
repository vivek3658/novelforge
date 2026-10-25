package com.vivek.novelforge.engagement.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "engagement_user_collections",
        uniqueConstraints = @UniqueConstraint(name = "uk_collection_owner_system_key",
                columnNames = {"owner_user_id", "system_key"}),
        indexes = @Index(name = "ix_collection_owner_deleted", columnList = "owner_user_id,deleted_at"))
@Getter
@Setter
@NoArgsConstructor
public class UserCollection extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "system_key", length = 32)
    private String systemKey;

    public UserCollection(Long ownerUserId, String name, String description, String systemKey) {
        this.ownerUserId = ownerUserId;
        this.name = name;
        this.description = description;
        this.systemKey = systemKey;
    }

    public boolean isSystemCollection() {
        return systemKey != null;
    }
}
