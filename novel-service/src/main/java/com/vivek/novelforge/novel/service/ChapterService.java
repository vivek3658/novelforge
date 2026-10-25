package com.vivek.novelforge.novel.service;

import com.vivek.novelforge.novel.dto.ChapterBlockRequestDto;
import com.vivek.novelforge.novel.dto.ChapterResponseDto;
import com.vivek.novelforge.novel.dto.CreateChapterRequestDto;
import com.vivek.novelforge.novel.dto.ScheduleChapterRequestDto;
import com.vivek.novelforge.novel.dto.UpdateChapterRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public interface ChapterService {
    ChapterResponseDto createChapter(Long novelId, CreateChapterRequestDto request,
                                     Authentication authentication, String authorization);
    ChapterResponseDto updateChapter(Long novelId, String chapterId, UpdateChapterRequestDto request,
                                     Authentication authentication, String authorization);
    ChapterResponseDto addBlock(Long novelId, String chapterId, ChapterBlockRequestDto request,
                                Authentication authentication, String authorization);
    ChapterResponseDto updateBlock(Long novelId, String chapterId, String blockId,
                                   ChapterBlockRequestDto request, Authentication authentication,
                                   String authorization);
    void deleteBlock(Long novelId, String chapterId, String blockId,
                     Authentication authentication, String authorization);
    void deleteChapter(Long novelId, String chapterId, Authentication authentication, String authorization);
    ChapterResponseDto publishChapter(Long novelId, String chapterId,
                                      Authentication authentication, String authorization);
    ChapterResponseDto scheduleChapter(Long novelId, String chapterId, ScheduleChapterRequestDto request,
                                       Authentication authentication, String authorization);
    ChapterResponseDto cancelSchedule(Long novelId, String chapterId,
                                      Authentication authentication, String authorization);
    ChapterResponseDto getPublicChapter(Long novelId, String chapterId);
    ChapterResponseDto getStudioChapter(UUID studioId, Long novelId, String chapterId,
                                        Authentication authentication, String authorization);
    Page<ChapterResponseDto> getPublicChapters(Long novelId, Pageable pageable);
    Page<ChapterResponseDto> getStudioChapters(UUID studioId, Long novelId, Pageable pageable,
                                               Authentication authentication, String authorization);
}
