package com.vivek.novelforge.studio.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.studio.type.StudioRoleType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Fetch;

import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StudioMembership extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(value = EnumType.STRING)
    private List<StudioRoleType> studioRoleTypes;

    @Column(nullable = false,name = "studio_id")
    private Long studioId;
    @Column(nullable = false,name = "user_id")
    private Long userId;
}
