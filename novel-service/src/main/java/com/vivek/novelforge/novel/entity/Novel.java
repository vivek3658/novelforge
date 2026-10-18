package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.novel.types.CategoryType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Novel extends BaseEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Scalar reference: Studio Service owns Studio records and membership rules.
    @Column(name = "studio_id")
    private UUID studioId;

    private String title;

    private String synopsis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType categoryType;
}
