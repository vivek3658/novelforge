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
public class TextBlock extends ChapterBlock {

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
}
