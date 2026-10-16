package com.vivek.novelforge.novel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "genres",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_genres_slug",
                columnNames = "slug"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String slug;

    @Column(nullable = false, length = 80)
    private String displayName;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}