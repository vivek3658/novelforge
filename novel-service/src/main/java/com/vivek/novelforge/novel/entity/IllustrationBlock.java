package com.vivek.novelforge.novel.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IllustrationBlock extends ChapterBlock {

    @Column(nullable = false)
    private String imageUrl;

    private String caption;

    private String altText;
}
