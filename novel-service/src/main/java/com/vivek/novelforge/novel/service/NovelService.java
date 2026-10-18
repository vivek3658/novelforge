package com.vivek.novelforge.novel.service;

import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public interface NovelService {

    NovelResponseDto createNovel(
            UUID studioId,
            NovelRequestDto request,
            Authentication authentication
    );

    NovelResponseDto updateNovel(
            Long novelId,
            NovelRequestDto request,
            Authentication authentication
    );

    NovelResponseDto getNovel(Long novelId, Authentication authentication);

    void deleteNovel(Long novelId, Authentication authentication);

    NovelResponseDto publishNovel(Long novelId, Authentication authentication);

    Page<NovelResponseDto> getStudioNovels(
            UUID studioId,
            Pageable pageable,
            Authentication authentication
    );

    Page<NovelResponseDto> searchPublicNovels(
            String query,
            Pageable pageable
    );
}