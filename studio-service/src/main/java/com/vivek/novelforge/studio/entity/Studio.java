package com.vivek.novelforge.studio.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.studio.type.VisibilityType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Studio extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false)
    @Size(min = 3,max = 50)
    private String studioName;
    @Column(unique = true,nullable = false)
    @Size(min = 3,max = 50)
    private String studioHandle;
    @Size(max = 200)
    private String profileImageName;
    @Size(max = 200)
    private String bannerImageName;
    @Size(max = 500)
    private String description;
    @Enumerated(EnumType.STRING)
    private VisibilityType visibilityType = VisibilityType.PUBLIC;
}
