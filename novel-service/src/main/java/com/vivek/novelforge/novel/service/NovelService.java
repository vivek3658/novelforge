package com.vivek.novelforge.novel.service;

import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.util.UUID;
import com.vivek.novelforge.novel.types.CategoryType;

public interface NovelService {

    NovelResponseDto createNovel(
            UUID studioId,
            NovelRequestDto request,
            Authentication authentication,
            String authorization
    );

    NovelResponseDto updateNovel(
            Long novelId,
            NovelRequestDto request,
            Authentication authentication,
            String authorization
    );

    NovelResponseDto getNovel(Long novelId);

    NovelResponseDto getStudioNovel(UUID studioId, Long novelId, Authentication authentication, String authorization);

    void deleteNovel(Long novelId, Authentication authentication, String authorization);

    NovelResponseDto cancelDeletion(Long novelId, Authentication authentication, String authorization);

    NovelResponseDto publishNovel(Long novelId, Authentication authentication, String authorization);

    Page<NovelResponseDto> getStudioNovels(
            UUID studioId,
            Pageable pageable,
            Authentication authentication,
            String authorization
    );

    Page<NovelResponseDto> searchPublicNovels(
            String query,
            CategoryType category,
            String genre,
            String tag,
            Pageable pageable
    );
}
