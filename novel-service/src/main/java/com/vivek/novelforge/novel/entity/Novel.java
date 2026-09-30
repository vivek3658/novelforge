package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.novel.types.CategoryType;
import jakarta.persistence.*;
import lombok.*;

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

    private String title;

    private String synopsis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType categoryType;
}
