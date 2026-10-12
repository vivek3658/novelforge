package com.vivek.novelforge.studio.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.studio.type.StudioMembershipStatus;
import com.vivek.novelforge.studio.type.StudioRoleType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "studio_memberships",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_studio_memberships_studio_user",
                columnNames = {"studio_id", "user_id"}
        ),
        indexes = @Index(
                name = "ix_studio_memberships_user_id",
                columnList = "user_id"
        )
)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StudioMembership extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StudioRoleType role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StudioMembershipStatus status = StudioMembershipStatus.INVITED;

    @Column(nullable = false, name = "studio_id")
    private UUID studioId;

    @Column(nullable = false, name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private Instant invitedAt;

    private Instant joinedAt;
}
