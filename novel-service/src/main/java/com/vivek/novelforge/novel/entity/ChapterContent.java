package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.novel.types.ChapterContentType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

public class ChapterContent {
    @Enumerated(value = EnumType.STRING)
    private ChapterContentType chapterContentType;
}
