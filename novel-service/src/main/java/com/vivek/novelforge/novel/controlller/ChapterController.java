package com.vivek.novelforge.novel.controlller;

import com.vivek.novelforge.novel.dto.ChapterBlockRequestDto;
import com.vivek.novelforge.novel.dto.ChapterResponseDto;
import com.vivek.novelforge.novel.dto.CreateChapterRequestDto;
import com.vivek.novelforge.novel.dto.ScheduleChapterRequestDto;
import com.vivek.novelforge.novel.dto.UpdateChapterRequestDto;
import com.vivek.novelforge.novel.service.ChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class ChapterController {
    private final ChapterService chapterService;

    @PostMapping("/novels/{novelId}/chapters")
    public ResponseEntity<ChapterResponseDto> createChapter(
            @PathVariable Long novelId,
            @Valid @RequestBody CreateChapterRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chapterService.createChapter(novelId, request, authentication, authorization));
    }

    @GetMapping("/novels/{novelId}/chapters")
    public Page<ChapterResponseDto> getPublicChapters(
            @PathVariable Long novelId,
            @PageableDefault(size = 20, sort = "chapterNumber", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return chapterService.getPublicChapters(novelId, pageable);
    }

    @GetMapping("/studios/{studioId}/novels/{novelId}/chapters")
    public Page<ChapterResponseDto> getStudioChapters(
            @PathVariable UUID studioId,
            @PathVariable Long novelId,
            @PageableDefault(size = 20, sort = "chapterNumber", direction = Sort.Direction.ASC) Pageable pageable,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.getStudioChapters(studioId, novelId, pageable, authentication, authorization);
    }

    @GetMapping("/novels/{novelId}/chapters/{chapterId}")
    public ChapterResponseDto getPublicChapter(
            @PathVariable Long novelId,
            @PathVariable String chapterId
    ) {
        return chapterService.getPublicChapter(novelId, chapterId);
    }

    @GetMapping("/studios/{studioId}/novels/{novelId}/chapters/{chapterId}")
    public ChapterResponseDto getStudioChapter(
            @PathVariable UUID studioId,
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.getStudioChapter(studioId, novelId, chapterId, authentication, authorization);
    }

    @PatchMapping("/novels/{novelId}/chapters/{chapterId}")
    public ChapterResponseDto updateChapter(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            @Valid @RequestBody UpdateChapterRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.updateChapter(novelId, chapterId, request, authentication, authorization);
    }

    @PostMapping("/novels/{novelId}/chapters/{chapterId}/blocks")
    public ResponseEntity<ChapterResponseDto> addBlock(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            @Valid @RequestBody ChapterBlockRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chapterService.addBlock(novelId, chapterId, request, authentication, authorization));
    }

    @PutMapping("/novels/{novelId}/chapters/{chapterId}/blocks/{blockId}")
    public ChapterResponseDto updateBlock(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            @PathVariable String blockId,
            @Valid @RequestBody ChapterBlockRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.updateBlock(novelId, chapterId, blockId, request, authentication, authorization);
    }

    @DeleteMapping("/novels/{novelId}/chapters/{chapterId}/blocks/{blockId}")
    public ResponseEntity<Void> deleteBlock(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            @PathVariable String blockId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        chapterService.deleteBlock(novelId, chapterId, blockId, authentication, authorization);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/novels/{novelId}/chapters/{chapterId}")
    public ResponseEntity<Void> deleteChapter(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        chapterService.deleteChapter(novelId, chapterId, authentication, authorization);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/novels/{novelId}/chapters/{chapterId}/publish")
    public ChapterResponseDto publishChapter(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.publishChapter(novelId, chapterId, authentication, authorization);
    }

    @PostMapping("/novels/{novelId}/chapters/{chapterId}/schedule")
    public ChapterResponseDto scheduleChapter(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            @Valid @RequestBody ScheduleChapterRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.scheduleChapter(novelId, chapterId, request, authentication, authorization);
    }

    @DeleteMapping("/novels/{novelId}/chapters/{chapterId}/schedule")
    public ChapterResponseDto cancelSchedule(
            @PathVariable Long novelId,
            @PathVariable String chapterId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return chapterService.cancelSchedule(novelId, chapterId, authentication, authorization);
    }
}
