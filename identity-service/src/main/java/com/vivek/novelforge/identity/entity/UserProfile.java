package com.vivek.novelforge.identity.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "user_profiles")
public class UserProfile extends BaseEntity {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(nullable = false, length = 50)
    private String displayName;

    @Column(length = 2000)
    private String bio;

    private String profileImageName;

    private String bannerImageName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProfileVisibility visibility;
}