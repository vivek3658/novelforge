package com.vivek.novelforge.novel.service;

public interface ChapterService {
    void createChapter();
    void updateChapter();
    void deleteChapter();
    void publishChapter();
    void getChapter();
    void getAllChapterFromNovels(); //pagination
}
