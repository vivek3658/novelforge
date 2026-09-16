package com.vivek.novelforge.novel.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String chapterTitle;
    private Long chapterNo;
    // TODO: Map ChapterContent entity relationship (@OneToMany or @ElementCollection)
    // private List<ChapterContent> chapterContents;
}
