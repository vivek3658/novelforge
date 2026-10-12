package com.vivek.novelforge.studio.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.studio.type.StudioStatus;
import com.vivek.novelforge.studio.type.VisibilityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "studios")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Studio extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    @Size(min = 3, max = 50)
    private String studioName;

    @Column(nullable = false, unique = true, length = 50)
    @Size(min = 3, max = 50)
    private String studioHandle;

    @Column(nullable = false)
    private Long ownerUserId;

    @Column(length = 200)
    @Size(max = 200)
    private String profileImageName;

    @Column(length = 200)
    @Size(max = 200)
    private String bannerImageName;

    @Column(length = 500)
    @Size(max = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VisibilityType visibilityType = VisibilityType.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StudioStatus status = StudioStatus.ACTIVE;

    @Version
    private Long version;

    @Column(name = "status_before_deletion", length = 20)
    @Enumerated(EnumType.STRING)
    private StudioStatus statusBeforeDeletion;
}
