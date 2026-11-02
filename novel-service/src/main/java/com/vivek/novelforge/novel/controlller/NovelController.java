package com.vivek.novelforge.novel.controlller;

import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import com.vivek.novelforge.novel.service.NovelService;
import com.vivek.novelforge.novel.types.CategoryType;
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
public class NovelController {
    private final NovelService novelService;

    @PostMapping("/studios/{studioId}/novels")
    public ResponseEntity<NovelResponseDto> createNovel(
            @PathVariable UUID studioId,
            @Valid @RequestBody NovelRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                novelService.createNovel(studioId, request, authentication, authorization));
    }

    @GetMapping("/studios/{studioId}/novels")
    public Page<NovelResponseDto> getStudioNovels(
            @PathVariable UUID studioId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return novelService.getStudioNovels(studioId, pageable, authentication, authorization);
    }

    @GetMapping("/studios/{studioId}/novels/{novelId}")
    public NovelResponseDto getStudioNovel(
            @PathVariable UUID studioId,
            @PathVariable Long novelId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return novelService.getStudioNovel(studioId, novelId, authentication, authorization);
    }

    @PutMapping("/novels/{novelId}")
    public NovelResponseDto updateNovel(
            @PathVariable Long novelId,
            @Valid @RequestBody NovelRequestDto request,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return novelService.updateNovel(novelId, request, authentication, authorization);
    }

    @GetMapping("/novels/{novelId}")
    public NovelResponseDto getNovel(@PathVariable Long novelId) {
        return novelService.getNovel(novelId);
    }

    @DeleteMapping("/novels/{novelId}")
    public ResponseEntity<Void> deleteNovel(
            @PathVariable Long novelId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        novelService.deleteNovel(novelId, authentication, authorization);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/novels/{novelId}/deletion/cancel")
    public NovelResponseDto cancelDeletion(
            @PathVariable Long novelId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return novelService.cancelDeletion(novelId, authentication, authorization);
    }

    @PostMapping("/novels/{novelId}/publish")
    public NovelResponseDto publishNovel(
            @PathVariable Long novelId,
            Authentication authentication,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization
    ) {
        return novelService.publishNovel(novelId, authentication, authorization);
    }

    @GetMapping("/novels/search")
    public Page<NovelResponseDto> searchPublicNovels(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) CategoryType category,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return novelService.searchPublicNovels(query, category, genre, tag, pageable);
    }
}
